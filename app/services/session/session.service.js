import _ from 'lodash';
import Papa from 'papaparse';
import yaml from 'js-yaml';
import GitHub from 'github-api';
import FileSaver from 'file-saver';

/* global angular */
/* global ENVIRONMENT */

export default class SessionService {

  constructor($http, $timeout, $location, $sce, $rootScope, $localStorage) {
    // console.log('SessionService', $localStorage, $location.search());
    var that = this;
    this.name = 'DefaultSessionName';
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.$localStorage = $localStorage;
    window.$localStorage = $localStorage;
    this.$sce = $sce;
    this.$rootScope = $rootScope;
    this.defaultConfigName = '';

    this.loadSiteConfig(function() {
      var searchParams = that.$location.search();
      // console.log('this.loadSiteConfig ... searchParams', searchParams);
      if (searchParams && searchParams.config) {
        that.loadURLConfig(searchParams.config);
      }
      else if (that.$localStorage.configURL) {
        that.loadURLConfig(that.$localStorage.configURL);
      }
      else if (that.defaultConfigName) {
        that.loadConfigurationByName(that.defaultConfigName);
      }
    });
  }

  loadSiteConfig(continuation) {
    var that = this;
    var base = document.getElementsByTagName('base')[0].href;
    // var siteConfigURL = window.location.origin + '/' + window.location.pathname + 'configurations/index.json';
    var siteConfigURL = base + 'configurations/index.json';
    this.baseURL = null;
    this.logoImage = null;

    let loc = this.$location;
    this.baseURL = loc.protocol() + '://' + loc.host() + ':' + loc.port() + loc.path();
    this.logoImage = null;
    this.configNames = [];
    this.configByName = {};

    // console.log('siteConfigURL', siteConfigURL, this.baseURL);
    this.$http.get(
      siteConfigURL,
      {
        withCredentials: false
      }).then(
      function(result) {
        let data = result.data;
        that.configNames = data.configNames;
        that.logoImage = data.logoImage || 'INCA.png';

        if (ENVIRONMENT !== 'development') {
          that.baseURL = data.baseURL || that.baseURL;
        }

        that.configNames.forEach(function(c) {
          that.configByName[c] = 'configurations/' + c + '/config.yaml';
        });
        that.defaultConfigName = that.configNames[0];

        // console.log('#configNames', that.configNames);
        // console.log('#logoImage', that.logoImage);
        // console.log('#baseURL', that.baseURL);
        // console.log('#defaultConfigName', that.defaultConfigName);
        continuation();
      },
      function(error) {
        const errmsg = 'Error loading Site Configuration '
                          + siteConfigURL + '\n\n'
                          + JSON.stringify(error);
        console.log('errmsg', errmsg, error);
        that.setErrorConfig(errmsg);
      }
    );
  }

  setErrorConfig(error) {
    this.errorMessageConfig = error;
    this.titleConfig = '';
    this.sourceConfig = '';
    this.parsedConfig = null;
  }

  loadConfigurationByName(name) {
    var config = this.configByName[name];
    if (config) {
      this.loadURLConfig(config);
    }
  }

  updateLocation(eraseXSV) {
    var searchParams = this.$location.search();
    if (this.configURL) {
      searchParams.config = this.configURL;

      if (this.patternURL) {
        searchParams.yaml = this.patternURL;
      }
      else {
        // delete searchParams.yaml;
      }
      if (this.XSVURL) {
        searchParams.xsv = this.XSVURL;
      }
      else if (eraseXSV) {
        delete searchParams.xsv;
      }
    }
    else {
      searchParams = {};
    }

    // console.log('updateLocation', this.configURL, this.patternURL, this.XSVURL, searchParams);
    this.$location.search(searchParams);
  }

  loadSourceConfig(source, title, configURL, continuation) {
    // console.log('loadSourceConfig', title, this.$localStorage.configURL, configURL);

    this.parsedPattern = null;
    this.autocompleteRegistry = null;
    this.columnDefs = null;
    this.rowData = [];
    this.parsedConfig = null;

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

    this.sourceConfig = source;
    this.titleConfig = title;
    this.configURL = configURL;
    this.errorMessageConfig = null;
    this.rowData = [];

    this.updateLocation();
    // var searchParams = this.$location.search();
    // if (configURL) {
    //   searchParams.config = this.configURL;
    //   console.log('###loadSourceConfig update search.config', searchParams.config);
    //   this.$location.search(searchParams);
    // }

    var that = this;
    if (this.$localStorage.configURL !== this.configURL) {
      console.log('#########loadSourceConfig WIPELOCAL', this.$localStorage.configURL, this.configURL);
      this.$localStorage.configURL = this.configURL;
      this.$localStorage.titleXSV = '';
      this.$localStorage.rowData = [];
      this.$localStorage.patternURL = '';
    }

    if (continuation) {
      continuation();
    }
    else {
      console.log('NO CONTINUATION');
      debugger;
    }
  }

  loadURLConfig(configURL) {
    var that = this;
    // The following should already happen in loadSourceConfig above.
    // var searchParams = this.$location.search();
    // searchParams.config = configURL;
    // console.log('###loadURLConfig update search.config', searchParams.config);
    // this.$location.search(searchParams);
    // this.configURL = configURL;

    // this.$localStorage.configURL = configURL;
    // this.rowData.length = 0;
    // this.$location.search('yaml', null);
    // this.$location.search('xsv', null);
    this.$http.get(configURL, {withCredentials: false}).then(
      function(result) {
        var configSource = result.data;
        // console.log('loadSourceConfig', 'ONE');
        that.loadSourceConfig(configSource, configURL, configURL, function() {
          // console.log('that.loadSourceConfig completed', 'ONE');
          that.parseConfig(function() {
            if (that.parsedConfig.defaultPatterns || that.parsedConfig.defaultXSVs) {
              // console.log('defaults available. Skipping menu.yaml load. that', that);
              // console.log('that.$rootScope.$broadcast parsedConfig1');
              that.$rootScope.$broadcast('parsedConfig');
            }
            else {
              var menuURL = configURL.replace(/config\.yaml$/, 'menu.yaml');
              that.$http.get(menuURL, {withCredentials: false}).then(
                function(menuResult) {
                  var menuSource = menuResult.data;
                  configSource += '\n';
                  configSource += menuSource;
                  // console.log('loadSourceConfig', 'TWO');
                  that.loadSourceConfig(configSource, configURL, configURL, function() {
                    that.parseConfig(function() {
                      // console.log('that.$rootScope.$broadcast parsedConfig1');
                      that.$rootScope.$broadcast('parsedConfig');
                    });
                  });
                },
                function(error) {
                  var errmsg = 'Warning: No menu.yaml available at: ' + menuURL + '\n\n' + JSON.stringify(error);
                  console.log(errmsg);
                  that.setErrorConfig(errmsg);
                  // console.log('loadSourceConfig', 'THREE');
                  that.loadSourceConfig(configSource, configURL, configURL);
                }
              );
            }
          });
        });
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
        root_class: [entry.root_class],
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

  parsePattern(source, title, url, continuation, continuationErrors) {
    var that = this;

    this.sourcePattern = source;
    this.titlePattern = title;
    this.patternURL = url;
    this.errorMessagePattern = null;

    var errors = [];

    try {
      var doc = yaml.safeLoad(this.sourcePattern);
      this.parsedPattern = doc;

      this.generateDefaultACRegistry();
      _.each(this.parsedPattern.vars,
        function(classname, key) {
          if (that.parsedPattern) {
            let compressSpaces = classname.replace(/ [ ]+/g, ' ');
            let varClasses = compressSpaces.split(' or ');
            let cleanedVarClasses = varClasses.map(function(c) {
              let cNoQuotes = that.stripQuotes(c);
              return cNoQuotes;
            });
            let curies = cleanedVarClasses.map(function(c) {
              let curie = that.parsedPattern.classes[c];
              if (!curie) {
                var acEntry = that.autocompleteRegistry[c];
                curie = that.autocompleteRegistry[c].root_class[0];
              }
              return curie;
            });
            // console.log('parsedPattern', classname, key, that.parsedPattern, varClasses, cleanedVarClasses, curies);

            var configEntries = [];
            var curieRoots = [];
            var curiePrefixes = [];
            var lookupType = null;
            var iriPrefix = null;
            curies.forEach(function(curie) {
              if (typeof curie !== 'string') {
                const error = 'Error in pattern for var "' + classname + '"';
                console.log('error', error, that.parsedPattern);
                errors.push(error);
              }
              else {
                curie = that.ensureColons(curie);
                var curiePrefix = curie.split(':')[0];
                var configEntry = that.parsedConfig.prefixes[curiePrefix] ||
                      {
                        autocomplete: 'ols',
                        iriPrefix: 'http://purl.obolibrary.org/obo/'
                      };
                if (!lookupType) {
                  lookupType = configEntry.autocomplete;
                }
                else if (lookupType !== configEntry.autocomplete) {
                  const error = 'Multiple lookup_types detected' + lookupType + '/' + configEntry.autocomplete;
                  console.log('error', error, that.parsedPattern);
                  errors.push(error);
                }
                if (!iriPrefix) {
                  iriPrefix = configEntry.iriPrefix;
                }
                else if (iriPrefix !== configEntry.iriPrefix) {
                  const error = 'Multiple iriPrefixes detected' + iriPrefix + '/' + iriPrefix;
                  console.log('error', error, that.parsedPattern);
                  errors.push(error);
                }
                configEntries.push(configEntry);
                curieRoots.push(curie);
                curiePrefixes = curiePrefix;
              }
            });

            var labelColumn = key + '_label';
            that.autocompleteRegistry[key] = {
              idColumn: key,
              labelColumn: labelColumn,
              root_class: curieRoots,
              lookup_type: lookupType,
              iriPrefix: iriPrefix,
              curiePrefix: curiePrefixes
            };
            that.autocompleteRegistry[labelColumn] = {
              idColumn: key,
              labelColumn: labelColumn,
              root_class: curieRoots,
              lookup_type: lookupType,
              iriPrefix: iriPrefix,
              curiePrefix: curiePrefixes
            };

            // console.log('that.autocompleteRegistry', that.autocompleteRegistry[key]);
          }
        });
      if (!this.parsedPattern.vars) {
        this.parsedPattern.vars = [];
      }
    }
    catch (e) {
      const error = 'Error parsing pattern: ' + e;
      console.log(error);
      errors.push(error);
    }

    if (errors.length > 0) {
      if (continuationErrors) {
        continuationErrors(errors);
      }
    }
    else if (continuation) {
      this.$localStorage.patternURL = this.patternURL;

      continuation();
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

  isBooleanColumn(f) {
    var acEntry = this.autocompleteRegistry[f];
    var result = acEntry &&
                 acEntry.lookup_type === 'inline' &&
                 acEntry.idColumn === 'NOT' &&
                 acEntry.labelColumn === 'NOT';
    // console.log('isBooleanColumn', f, acEntry);
    return result;
  }

  isAutocompleteColumn(f) {
    var acEntry = this.autocompleteRegistry[f];
    var result = !!acEntry;
    // console.log('isAutocompleteColumn', f, result);
    return result;
  }

  isEditableColumn(f) {
    var acEntry = this.autocompleteRegistry[f];
    var result = !acEntry;
    // console.log('isEditableColumn', f, result);
    return result;
  }

  generateColumnDefsFromFields(fields, addIRI) {
    var that = this;
    function sanitizeColumnName(f) {
      return f.replace('(', '_').replace(')', '_');
    }

    var fieldsWithIRI = angular.copy(fields);

    if (addIRI) {
      fieldsWithIRI.unshift('defined_class_label');
      fieldsWithIRI.unshift('defined_class');
    }

    var unnamedColumnIndex = 0;
    var columnDefs = _.map(fieldsWithIRI, function(f) {
      var sanitizedName = sanitizeColumnName(f);
      var visible = true;
      if (f === '') {
        sanitizedName = 'UNNAMED_COLUMN' + unnamedColumnIndex;
        ++unnamedColumnIndex;
        visible = false;
      }
      var result = {
        name: sanitizedName,
        field: sanitizedName,
        originalName: f,
        displayName: f,
        minWidth: 100,
        width: 100,
        // maxWidth: 200,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
        visible: visible
      };

      if (f.endsWith('_label')) {
        result.width = 150;
      }

      if (that.isBooleanColumn(f)) {
        result.enableCellEditOnFocus = true;
        result.cellTemplate = 'cellStateTemplate';
        result.editableCellTemplate = 'cellStateBooleanTemplate';
        result.enableCellEdit = true;
        result.width = 55;
      }
      else if (that.isAutocompleteColumn(f)) {
        result.enableCellEditOnFocus = false;
        result.cellTemplate = 'cellStateTemplate';
        result.editableCellTemplate = 'cellStateAutocompleteTemplate';
        result.enableCellEdit = true;
      }
      else if (that.isEditableColumn(f)) {
        result.enableCellEditOnFocus = true;
        result.cellTemplate = 'cellStateTemplate';
        result.editableCellTemplate = 'cellStateEditableTemplate';
        result.enableCellEdit = true;
      }
      else {
        result.cellTemplate = 'cellStateReadonlyTemplate';
        result.enableCellEdit = false;
      }

      return result;
    });

    var lastCol = columnDefs[columnDefs.length - 1];
    if (lastCol && (!lastCol.name || lastCol.name.length === 0)) {
      columnDefs.length = columnDefs.length - 1;
    }

    let commandColumn = {
      name: 'Command',
      displayName: '',
      width: 30,
      field: '',
      resizable: false,
      cellTemplate: 'uigridActionCell',
      enableCellEdit: false,
      enableCellSelection: false,
      enableCellEditOnFocus: false,
      enableSorting: false,
      allowCellFocus: false,
      enableHiding: false,
      enableColumnMenu: false,
      headerCellTemplate: 'uigridActionHeader'
    };

    columnDefs.unshift(commandColumn);

    return columnDefs;
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

    var blob = new Blob([text], {type: "text/plain;charset=utf-8"});

    // console.log('export', this.titleXSV, this);
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

    FileSaver.saveAs(blob, exportedFilename);

/*
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
*/

  }


  exportGitHub() {
    console.log('exportGitHub');
    this.listRepos();
  }

  listRepos() {
    const that = this;
    const targetUserName = 'monarch-initiative';
    const gh = new GitHub();
    const targetUser = gh.getUser(targetUserName);
    targetUser.listRepos()
      .then(({ data: reposJson }) => {
        console.log(`${targetUserName} has ${reposJson.length} repos!`);
        console.log(reposJson);
        // that.reposList = reposJson.map(repo => repo.name);
      });
  }

  golrLookup(colName, oldValue, val, acEntry) {
    var golrURLBase = 'https://solr.monarchinitiative.org/solr/ontology/select';
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
              label: item.annotation_class_label
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

  ensureUnderscores(curie) {
    return curie.replace(/:/, '_');
  }

  ensureColons(curie) {
    return curie.replace(/_/, ':');
  }

  dataChanged() {
    if (this.rowData) {
      this.$localStorage.titleXSV = this.titleXSV;
      this.$localStorage.rowData = this.rowData;
      // this.$localStorage.patternURL = this.patternURL;
      // console.log('dataChanged', this.$localStorage.titleXSV, this.$localStorage.configURL, this.$localStorage.patternURL, this.patternURL);
      this.XSVURL = null;
      this.updateLocation(true);
      // console.log('...dataChanged stored', this.$localStorage.patternURL, this.$localStorage.rowData);
    }
    else {
      console.log('...dataChanged this.rowData NULL');
    }
  }

  olsLookup(colName, oldValue, val, acEntry) {
    var that = this;
    if (!val || val.length === 0) {
      return [];
    }
    else {
      // console.log('olsLookup', colName, oldValue, val, acEntry);
      var olsURLBase = 'https://www.ebi.ac.uk/ols/api/select';
      var whichClosures = [];
      acEntry.root_class.forEach(function(c) {
        if (c === '') {

        }
        else {
          var whichClosure = acEntry.iriPrefix + that.ensureUnderscores(c);
          whichClosures.push(whichClosure);
        }
      });
      acEntry.root_class.map(function(c) {
        var whichClosure = acEntry.iriPrefix + that.ensureUnderscores(c);
        return whichClosure;
      });
      // var ontology = acEntry.curiePrefix.toLowerCase();
      var requestParams = {
        q: val,
        type: 'class',
        fieldList: 'iri,label,short_form,obo_id,ontology_name,ontology_prefix,description,type',
        local: true,
        // ontology: ontologies,
        rows: 15
      };

      if (whichClosures.length === 0) {
        requestParams.local = true;
      }
      else {
        requestParams.allChildrenOf = whichClosures;
      }
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
                id: item.obo_id || that.ensureColons(item.short_form),
                label: item.label
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
        var result = data.map(
          function(item) {
            return {
              id: item.id,
              label: item.name
            };
          });
        return result;
      });
  }


  inlineLookup(colName, oldValue, val, acEntry) {
    var inlineBlock = this.parsedConfig.inline;

    var terms = [];
    if (inlineBlock && inlineBlock[colName]) {
      terms = inlineBlock[colName];
    }

    var matches = [];

    val = val || '';
    if (val !== null) {
      var valUpper = val.toUpperCase();
      _.each(terms, function(v) {
        if (v.label.toUpperCase().indexOf(valUpper) >= 0) {
          matches.push(v);
        }
      });
    }

    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(matches);
      }, 20);
    });

    // return matches;
  }
}
SessionService.$inject = ['$http', '$timeout', '$location', '$sce', '$rootScope', '$localStorage'];
