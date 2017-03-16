import _ from 'lodash';
import Papa from 'papaparse';

export default class SessionService {
  constructor($http, $timeout, $location, $sce) {
    this.name = 'DefaultSessionName';
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.$sce = $sce;
  }

  exportXSV(xsvType) {
    var delimiter = (xsvType === 'tsv') ? '\t' : ','; var config = {
      quotes: false,
      quoteChar: '"',
      delimiter: delimiter,
      header: true,
      newline: "\n"
    };

    var gridData = _.map(this.rowData, function(row) {
      var result = _.omit(row, '$$hashKey');
      return result;
    });
    var text = Papa.unparse(gridData, config);

    var data = new Blob([text], {type: 'text/plain'});
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (this.exportedXSV !== null) {
      window.URL.revokeObjectURL(this.exportedXSV);
    }

    this.exportedXSV = window.URL.createObjectURL(data);

    var link = document.createElement('a');
    link.href = this.exportedXSV;
    link.download = 'filename.html';
    link.target = '_blank';
    document.body.appendChild(link);  // required in FF, optional for Chrome/Safari
    link.click();
    document.body.removeChild(link);  // required in FF, optional for Chrome/Safari
  }


  golrLookup(colName, oldValue, val, acEntry) {
    var golrURLBase = 'https://solr.monarchinitiative.org/solr/ontology/select';
    var whichClosure = acEntry.root_class;
    var requestParams = {
      defType: 'edismax',
      qt: 'standard',
      wt: 'json',
      rows: '20',
      fl: '*',
      score: null,
      'facet.sort': 'count',
      'json.nl': 'arrarr',
      'facet.limit': '20',
      fq: 'isa_partof_closure:"' + whichClosure + '"',
      q: 'annotation_class_label_searchable:*' + val + '*',
      packet: '1',
      callback_type: 'search',
      _: Date.now()
    };

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
          console.log('GOLR success', golrURLBase, requestParams, data);
          var result = data.map(function(item) {
            return {
              id: item.id,
              label: [item.annotation_class_label]
            };
          });
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
    var olsURLBase = 'http://www.ebi.ac.uk/ols/api/select';
    var whichClosure = this.generateIRI(acEntry.iriPrefix, acEntry.root_class);
    var ontology = acEntry.curiePrefix.toLowerCase();
    var requestParams = {
      q: val,
      type: 'class',
      fieldList: 'iri,label,short_form,description',
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
          console.log('OLS success', olsURLBase, requestParams, data);
          var result = data.map(function(item) {
            return {
              id: item.short_form,
              label: [item.label]
            };
          });
          return result;
        },
        function(error) {
          console.log('OLS error: ', olsURLBase, requestParams, error);
        }
      );
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
}
SessionService.$inject = ['$http', '$timeout', '$location', '$sce'];
