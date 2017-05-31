import _ from 'lodash';
import Papa from 'papaparse';
import yaml from 'js-yaml';

/* global angular */

export default class SessionService {
  constructor($http, $timeout, $location, $sce, $rootScope) {
    this.name = 'DefaultSessionName';
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.$sce = $sce;
    this.$rootScope = $rootScope;
    this.defaultConfigName = 'go';

    this.initializeState();

    var that = this;
    var searchParams = this.$location.search();
    if (searchParams.config) {
      var config = searchParams.config;
      that.loadURLConfig(config);
    }
    else if (that.defaultConfigName) {
      that.loadConfigurationByName(that.defaultConfigName);
    }
  }

  initializeState() {
    this.parsedPattern = null;
    this.autocompleteRegistry = null;
    this.columnDefs = null;
    this.rowData = null;

    this.titleConfig = null;
    this.sourceConfig = null;
    this.parsedConfig = null;
    this.errorMessageConfig = null;

    this.defaultPatternURL = null;
    this.defaultXSVURL = null;

    this.filePattern = null;
    this.titlePattern = null;
    this.sourcePattern = null;
    this.parsedPattern = null;
    this.patternURL = null;
    this.errorMessagePattern = null;

    this.fileXSV = null;
    this.titleXSV = null;
    this.sourceXSV = null;
    this.parsedXSV = null;
    this.XSVURL = null;
    this.errorMessageXSV = null;
  }

  loadConfigurationByName(name) {
    const configByName = {
      hpo: 'configurations/hpo/config.yaml',
      ecto: 'configurations/ecto/config.yaml',
      go: 'configurations/go/config.yaml',
      beer: 'configurations/beer/config.yaml'
    };

    var config = configByName[name] || 'configurations/ecto/config.yaml';
    this.loadURLConfig(config);
  }

  loadSourceConfig(source, title, url) {
    this.initializeState();
    // console.log('loadSourceConfig', title, url, JSON.stringify(this.rowData));
    this.sourceConfig = source;
    this.titleConfig = title;
    this.configURL = url;
    this.errorMessageConfig = null;
    var search = {};
    if (url) {
      search.config = url;
    }
    this.$location.search(search);
    var that = this;
    this.parseConfig(function() {
      that.$rootScope.$broadcast('parsedConfig');
    });
  }

  loadURLConfig(configURL) {
    var that = this;
    this.configURL = configURL;
    this.$http.get(configURL, {withCredentials: false}).then(
      function(result) {
        that.loadSourceConfig(result.data, configURL, configURL);
      },
      function(error) {
        that.setErrorConfig('Error loading URL ' + configURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  generateDefaultACRegistry() {
    var that = this;
    that.autocompleteRegistry = {};
    _.each(that.parsedConfig.globalAutocomplete, function(entry, columnName) {
      that.autocompleteRegistry[columnName] = {
        iriPrefix: 'http://purl.obolibrary.org/obo/',
        curiePrefix: entry.curiePrefix,
        idColumn: columnName,
        labelColumn: entry.label,
        root_class: entry.root_class,
        lookup_type: entry.lookup_type
      };

      if (entry.label) {
        that.autocompleteRegistry[entry.label] = angular.copy(that.autocompleteRegistry[columnName]);
      }
    });
  }

  parseConfig(continuation) {
    try {
      var doc = yaml.safeLoad(this.sourceConfig);
      this.parsedConfig = doc;

      var that = this;
      this.generateDefaultACRegistry();
      this.initialized = true;

      continuation();
    }
    catch (e) {
      console.log('error', e);
    }
  }

  stripQuotes(s) {
    return s.replace(/^'/, '').replace(/'$/, '');
  }

  parsePattern(continuation) {
    var that = this;

    try {
      var doc = yaml.safeLoad(this.sourcePattern);
      this.parsedPattern = doc;

      this.generateDefaultACRegistry();
      _.each(this.parsedPattern.vars,
        function(classname, key) {
          if (that.parsedPattern) {
            classname = that.stripQuotes(classname);
            var curie = that.parsedPattern.classes[classname];
            if (!curie) {
              that.setErrorPattern('Error in pattern for var "' + classname + '"\n' + JSON.stringify(that.parsedPattern, null, 2));
            }
            else {
              var curiePrefix = curie.split(':')[0];
              var configEntry = that.parsedConfig.prefixes[curiePrefix] ||
                    {
                      autocomplete: 'ols',
                      iriPrefix: 'http://purl.obolibrary.org/obo/'
                    };

              var labelColumn = key + ' label';
              that.autocompleteRegistry[key] = {
                idColumn: key,
                labelColumn: labelColumn,
                root_class: curie,
                lookup_type: configEntry.autocomplete,
                iriPrefix: configEntry.iriPrefix,
                curiePrefix: curiePrefix
              };
              that.autocompleteRegistry[labelColumn] = {
                idColumn: key,
                labelColumn: labelColumn,
                root_class: curie,
                lookup_type: configEntry.autocomplete,
                iriPrefix: configEntry.iriPrefix,
                curiePrefix: curiePrefix
              };
            }
          }
        });
      if (!this.parsedPattern.vars) {
        this.parsedPattern.vars = [];
      }
      continuation();
    }
    catch (e) {
      console.log('error', e);
    }
  }

  parseXSV(continuation) {
    var that = this;
    var config = {
      download: false,
      // delimiter: '\t',  // auto-detect
      header: true,
      comments: true,
      // dynamicTyping: false,
      // preview: 0,
      // encoding: "",
      // worker: false,
      // comments: false,
      // step: undefined,
      // complete: undefined,
      // error: undefined,
      // download: false,
      skipEmptyLines: true,
      // chunk: undefined,
      // fastMode: undefined,
      // beforeFirstChunk: undefined,
      // withCredentials: undefined
    };


    config.complete = function(results, file) {
      that.parsedXSV = results;
      continuation();
    };

    Papa.parse(this.sourceXSV, config);
  }


  exportXSV(xsvType) {
    var delimiter = ((xsvType === 'tsv') || (xsvType === 'tab')) ?
                        '\t' :
                        ',';
    var config = {
      quotes: false,
      quoteChar: '"',
      delimiter: delimiter,
      header: true,
      newline: '\r\n'
    };

    let xsvColumns = this.columnDefs;

    var gridData = _.map(this.rowData, function(row) {
      // var result = _.omit(row, '$$hashKey');

      var transformedRow = {};
      _.each(xsvColumns, function(columnDef) {
        // console.log('columnDef.field', columnDef.field, row);
        if (columnDef.field.length > 0) {
          transformedRow[columnDef.originalName] = row[columnDef.field];
        }
      });

      return transformedRow;
    });

    gridData.reverse();
    var text = Papa.unparse(gridData, config);
    text = text + '\n';

    var data = new Blob([text], {type: 'text/plain'});
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (this.exportedXSV !== null) {
      window.URL.revokeObjectURL(this.exportedXSV);
    }

    this.exportedXSV = window.URL.createObjectURL(data);


    var importedFilename = this.titleXSV;
    var importedFilenameLast = importedFilename.lastIndexOf('/');
    if (importedFilenameLast >= 0) {
      importedFilename = importedFilename.slice(importedFilenameLast + 1);
    }
    var importedFilenameExt = importedFilename.lastIndexOf('.');
    if (importedFilenameExt >= 0) {
      importedFilename = importedFilename.slice(0, importedFilenameExt);
    }

    var exportedFilename = importedFilename + '.' + xsvType;
    // console.log('export', importedFilename, exportedFilename);
    var link = document.createElement('a');
    link.href = this.exportedXSV;
    link.download = exportedFilename;
    link.target = '_blank';
    document.body.appendChild(link);  // required in FF, optional for Chrome/Safari
    link.click();
    document.body.removeChild(link);  // required in FF, optional for Chrome/Safari
  }



  golrLookup(colName, oldValue, val, acEntry) {
    var golrURLBase = 'https://solr-dev.monarchinitiative.org/solr/ontology/select';
    var whichClosure = acEntry.root_class;
    var requestParams = {
      defType: 'edismax',
      qt: 'standard',
      wt: 'json',
      rows: '15',
      fl: '*',
      score: null,
      'facet.sort': 'count',
      'json.nl': 'arrarr',
      'facet.limit': '15',
      fq: 'isa_partof_closure:"' + whichClosure + '"',
      q: 'annotation_class_label_searchable:*' + val + '*',
      packet: '1',
      callback_type: 'search',
      _: Date.now()
    };

/*
  The following are experiments with using the Monarch /search ontology for AC.
  Unfortunately, the Monarch /search core doesn't seem to have as fine-grained closures
  needed for our purposes, but I may end up revisiting this, so I'm keeping the code around
  for a while. DBK
    var golrURLBaseImproved = 'https://solr.monarchinitiative.org/solr/search/select';
    var requestParamsImproved = {
      defType: 'edismax',
      qt: 'standard',
      wt: 'json',
      start: 0,
      rows: '15',
      fl: '*,score',
      'facet.mincount': 1,
      'facet.sort': 'count',
      'json.nl': 'arrarr',
      'facet.limit': '25',
      fq: 'category:"Phenotype"',
      // fq: 'isa_partof_closure:"' + whichClosure + '"',
      'facet.field': 'id',
      // fq: 'isa_partof_closure:"' + whichClosure + '"',
      // q: 'annotation_class_label_searchable:*' + val + '*',
      q: val + '+"' + val + '"',
      qf: [
    'label_searchable^1',
    'definition_searchable^1',
    'synonym_searchable^1',
    'iri_searchable^2',
    'id_searchable^2',
    'equivalent_iri_searchable^1',
    'equivalent_curie_searchable^1',
    'taxon_label_searchable^1',
    'taxon_label_synonym_searchable^1',
    'iri_std^3',
    'iri_kw^3',
    'iri_eng^3',
    'id_std^3',
    'id_kw^3',
    'id_eng^3',
    'label_std^2',
    'label_kw^2',
    'label_eng^2',
    'definition_std^1',
    'definition_kw^1',
    'definition_eng^1',
    'synonym_std^1',
    'synonym_kw^1',
    'synonym_eng^1',
    'category_std^1',
    'category_kw^1',
    'category_eng^1',
    'equivalent_iri_std^1',
    'equivalent_iri_kw^1',
    'equivalent_iri_eng^1',
    'equivalent_curie_std^1',
    'equivalent_curie_kw^1',
    'equivalent_curie_eng^1',
    'taxon_label_std^1',
    'taxon_label_kw^1',
    'taxon_label_eng^1',
    'taxon_label_synonym_std^1',
    'taxon_label_synonym_kw^1',
    'taxon_label_synonym_eng^1'
    ]
    };

    var requestParamsFromMonarchAC = {
      defType: 'edismax',
      qt: 'standard',
      indent: 'on',
      wt: 'json',
      start: 0,
      fl: '*,score',
      facet: true,
      'facet.mincount': 1,
      'facet.sort': 'count',
      'json.nl': 'arrarr',
      'facet.limit': '25',
      hl: true,
      'hl.simple.pre': '<em class="hilite">',
      'hl.snippets': '1000',
      'facet.field': 'id',
      q: val, // 'sedoheptulos+"sedoheptulos"',
      qf: [ 'label_searchable^1',
            'definition_searchable^1',
            'synonym_searchable^1',
            'iri_searchable^2',
            'id_searchable^2',
            'equivalent_iri_searchable^1',
            'equivalent_curie_searchable^1',
            'taxon_label_searchable^1',
            'taxon_label_synonym_searchable^1',
            'iri_std^3',
            'iri_kw^3',
            'iri_eng^3',
            'id_std^3',
            'id_kw^3',
            'id_eng^3',
            'label_std^2',
            'label_kw^2',
            'label_eng^2',
            'definition_std^1',
            'definition_kw^1',
            'definition_eng^1',
            'synonym_std^1',
            'synonym_kw^1',
            'synonym_eng^1',
            'category_std^1',
            'category_kw^1',
            'category_eng^1',
            'equivalent_iri_std^1',
            'equivalent_iri_kw^1',
            'equivalent_iri_eng^1',
            'equivalent_curie_std^1',
            'equivalent_curie_kw^1',
            'equivalent_curie_eng^1',
            'taxon_label_std^1',
            'taxon_label_kw^1',
            'taxon_label_eng^1',
            'taxon_label_synonym_std^1',
            'taxon_label_synonym_kw^1',
            'taxon_label_synonym_eng^1']
    };
*/

    var trusted = this.$sce.trustAsResourceUrl(golrURLBase);
    return this.$http.jsonp(
      trusted,
      {
        // withCredentials: false,
        jsonpCallbackParam: 'json.wrf',
        params: requestParams
      })
      .then(
        function(response) {
          var data = response.data.response.docs;
          var result = data.map(function(item) {
            return {
              id: item.id,
              name: item.annotation_class_label
              // name: item.label[0]
            };
          });
          // console.log('GOLR success', golrURLBase, requestParams, data, result);
          return result;
        },
        function(error) {
          console.log('GOLR error: ', golrURLBase, requestParams, error);
        }
      );
  }

  generateIRI(iriPrefix, curie) {
    return iriPrefix + curie.replace(/:/, '_');
  }

  olsLookup(colName, oldValue, val, acEntry) {
    if (!val || val.length === 0) {
      return [];
    }
    else {
      // console.log('olsLookup', colName, oldValue, val, acEntry);
      var olsURLBase = 'https://www.ebi.ac.uk/ols/api/select';
      var whichClosure = this.generateIRI(acEntry.iriPrefix, acEntry.root_class);
      var ontology = acEntry.curiePrefix.toLowerCase();
      var requestParams = {
        q: val,
        type: 'class',
        fieldList: 'iri,label,short_form,obo_id,ontology_name,ontology_prefix,description,type',
        // local: true,
        ontology: ontology,
        allChildrenOf: whichClosure,
        rows: 15
      };

      // requestParams.ontology = ontology;
      // if (ontology !== 'exo') {
      //   requestParams.ontology = ontology;
      // }

      return this.$http.get(
        olsURLBase,
        {
          withCredentials: false,
          params: requestParams
        })
        .then(
          function(response) {
            var data = response.data.response.docs;
            // console.log('OLS success', olsURLBase, requestParams, data);
            var result = data.map(function(item) {
              return {
                id: item.obo_id,  // short_form,
                name: item.label
              };
            });
            return result;
          },
          function(error) {
            console.log('OLS error: ', olsURLBase, requestParams, error);
          }
        );
    }
  }


  monarchLookup(colName, oldValue, val, acEntry) {
    return this.$http.get(
      'https://monarchinitiative.org/autocomplete/' + val + '.json',
      {
        withCredentials: false,
        params: {
        }
      })
      .then(function(response) {
        var data = response.data;
        console.log('Monarch success', data);
        var result = data.map(function(item) {
          return item;
        });
        return result;
      });
  }



  inlineLookup(colName, oldValue, val, acEntry) {
    var inlineBlock = this.parsedConfig.inline;
    var terms = [
      {id: 'BEER:0000001', name: 'Pilsner'},
      {id: 'BEER:0000002', name: 'Lager'},
      {id: 'BEER:0000003', name: 'Ale'},
      {id: 'BEER:0000004', name: 'Pale Ale'},
      {id: 'BEER:0000005', name: 'India Pale Ale'},
      {id: 'BEER:0000006', name: 'Porter'},
      {id: 'BEER:0000007', name: 'Stout'}
    ];

    if (inlineBlock && inlineBlock[colName]) {
      terms = _.map(inlineBlock[colName], function(v) {
        return {
          id: v,
          name: v
        };
      });
    }

    var matches = [];

    if (val) {
      var valUpper = val.toUpperCase();
      _.each(terms, function(v) {
        if (v.name.toUpperCase().indexOf(valUpper) >= 0) {
          matches.push(v);
        }
      });
    }

    return matches;
  }

}
SessionService.$inject = ['$http', '$timeout', '$location', '$sce', '$rootScope'];
