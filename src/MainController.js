import angular from 'angular';
import _ from 'lodash';
import yaml from 'js-yaml';
import Papa from 'papaparse';

if (!String.prototype.endsWith) {
  /* eslint no-extend-native: 0 */
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.lastIndexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

class MainController {
  getTerm(val) {
    return this.$http.get(
      'https://monarchinitiative.org/autocomplete/' + val + '.json',
      {
        withCredentials: false,
        params: {
        }
      })
      .then(function(response) {
        var data = response.data;
        var result = data.map(function(item) {
          return item;
        });
        return result;
      });
  }

  termSelected(item, model, label, event) {
    var cellNav = this.gridApi.cellNav;
    var cell = cellNav.getFocusedCell();
    var cellName = cell.col.colDef.name;
    var cellValue = cell.row.entity[cellName];

    if (this.isAutocompleteColumn(cellName)) {
      cell.row.entity[cellName] = cellValue.id;
      if (cellValue.label) {
        cell.row.entity[cellName + ' label'] = cellValue.label[0];
      }
    }
    else {
      cell.row.entity[cellName] = cellValue;
    }

    this.$scope.$broadcast(this.uiGridEditConstants.events.END_CELL_EDIT);
  }

  // constructor arglist must match invocation in app.js
  constructor($scope, $resource, $http, $timeout, $location, uiGridConstants, uiGridEditConstants) {
    this.$scope = $scope;
    this.$resource = $resource;
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.uiGridConstants = uiGridConstants;
    this.uiGridEditConstants = uiGridEditConstants;

    this.showYAMLSource = false;
    this.showYAMLParsed = false;
    this.setErrorYAML(null);
    this.examplesYAML = [
      {
        url: 'examples/exposure_to_change_in_levels.yaml',
        title: 'Environmental Conditions YAML (Local)',
        type: 'yaml'
      },
      {
        url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/patterns/exposure_to_change_in_levels.yaml',
        title: 'Environmental Conditions YAML (Remote)',
        type: 'yaml'
      }
    ];
    this.YAMLURL = null;
    this.defaultYAMLURL = this.examplesYAML[0].url;

    this.showXSVSource = false;
    this.showXSVParsed = false;
    this.sourceXSV = '';
    this.titleXSV = '';
    this.exportedXSV = null;
    this.errorMessageXSV = null;
    this.setErrorXSV(null);
    this.examplesXSV = [
      {
        url: 'examples/exposure_to_change_in_levels.csv',
        title: 'Environmental Conditions CSV (Local)',
        type: 'csv'
      },
      {
        url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/ontology/modules/exposure_to_change_in_levels.csv',
        title: 'Environmental Conditions CSV (Remote)',
        type: 'csv'
      },
      {
        url: 'https://gist.githubusercontent.com/DoctorBud/8d2f7e33d0055c13f310f1e767225ffa/raw/4c6988967debf9c274ad952ad4eb8b8ebeda5d30/genetest.tsv',
        title: 'HPO TSV (Not Yet Working) (Remote)',
        type: 'tsv'
      }
    ];
    this.XSVURL = null;
    this.defaultXSVURL = this.examplesXSV[0].url;

    var that = this;

    this.setupGrid();

    $timeout(
      function () {
        that.continueInitialization();
      },
      10);
  }

  continueInitialization() {
    var that = this;

    this.$scope.$watch('c.fileYAML', function () {
      that.loadFileYAML(that.fileYAML);
    });

    var search = window.location.search;
    // console.log('window.location', window.location);
    // console.log('search', search);
    var yamlPrefix = '?yaml=';
    if (search && search.indexOf(yamlPrefix) === 0) {
      search = search.slice(yamlPrefix.length);
      // console.log('searchurl', search);
      that.loadURLYAML(search);
    }
    else if (that.defaultYAMLURL) {
      that.loadURLYAML(that.defaultYAMLURL);
    }

    this.$scope.$watch('c.fileXSV', function () {
      that.loadFileXSV(that.fileXSV);
    });

    var xsvPrefix = '?xsv=';
    if (search && search.indexOf(xsvPrefix) === 0) {
      search = search.slice(xsvPrefix.length);
      // console.log('searchurl', search);
      that.loadURLXSV(search);
    }
    else if (that.defaultXSVURL) {
      that.loadURLXSV(that.defaultXSVURL);
    }
  }


  // YAML stuff

  setErrorYAML(error) {
    this.errorMessageYAML = error;
    this.titleYAML = '';
    this.sourceYAML = '';
    this.parsedYAML = null;
  }

  parseYAML() {
    var renderElement = document.getElementById('YAMLParsed');

    try {
      var doc = yaml.safeLoad(this.sourceYAML);
      this.parsedYAML = doc;
    }
    catch (e) {
      console.log('error', e);
    }
  }

  loadSourceYAML(source, title, url) {
    this.sourceYAML = source;
    this.titleYAML = title;
    // this.YAMLURL = url;
    this.errorMessage = null;
    if (url) {
      var hash = '?yaml=' + url;
      var newURL =  // window.location.protocol +
                    // window.location.host +
                    window.location.pathname +
                    hash;
      // console.log('newURL:', newURL);
      var stateObj = window.history.state;
      window.history.replaceState(stateObj, title, newURL);
      // this.$location.search({url: url});
    }
    else {
      window.history.replaceState(stateObj, title, window.location.pathname);
    }
    this.parseYAML();
  }

  loadURLYAML(YAMLURL) {
    var that = this;
    this.YAMLURL = YAMLURL;
    this.$http.get(YAMLURL, {withCredentials: false}).then(
      function(result) {
        // console.log('loadURLYAML success', result.data);
        that.loadSourceYAML(result.data, YAMLURL, YAMLURL);
      },
      function(error) {
        console.log('loadURLYAML error', error);
        that.setErrorYAML('Error loading URL ' + YAMLURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  loadSourceYAMLItem(source, title, url) {
    if (source) {
      this.loadSourceYAML(source, title, url);
    }
    else {
      this.loadURLYAML(url);
    }
  }

  loadFileYAML(file) {
    var that = this;
    if (file) {
      if (!file.$error) {
        var reader = new FileReader();
        var blobText = '';
        reader.addEventListener("loadend", function() {
          blobText = reader.result;
          that.loadSourceYAML(blobText, file.name);
        });
        reader.readAsText(file);
      }
    }
  }


// XSV stuff

  setErrorXSV(error) {
    this.errorMessageXSV = error;
    this.titleXSV = '';
    this.sourceXSV = '';
    this.parsedXSV = null;
  }

  parseXSV() {
    var that = this;
    var renderElement = document.getElementById('XSVParsed');
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
      that.$timeout(function() {
        that.parsedXSV = results; // .data;
        that.gridOptions.columnDefs = _.map(results.meta.fields, function(f) {
          var result = {
            name: f,
            field: f,
            displayName: f,
            enableCellEdit: false,
            enableCellEditOnFocus: false
          };

          if (that.isAutocompleteColumn(f)) {
            result.enableCellEditOnFocus = true;
            result.editableCellTemplate = 'cellStateAutocompleteTemplate';
            result.cellTemplate = 'cellStateTemplate';
            result.enableCellEdit = true;
          }
          else if (that.isEditableColumn(f)) {
            result.enableCellEditOnFocus = true;
            result.cellTemplate = 'cellStateTemplate';
            result.enableCellEdit = true;
          }
          else {
            result.cellTemplate = 'cellStateReadonlyTemplate';
          }

          return result;
        });

        var data = _.map(results.data, function(row) {
          return row;
        });
        that.gridOptions.data = data;
        that.gridApi.core.handleWindowResize();
      }, 0);
    };

    Papa.parse(this.sourceXSV, config);
  }

  loadSourceXSV(source, title, url) {
    this.sourceXSV = source;
    this.titleXSV = title;
    // this.XSVURL = url;
    this.errorMessage = null;
    if (url) {
      var hash = '?xsv=' + url;
      var newURL =  // window.location.protocol +
                    // window.location.host +
                    window.location.pathname +
                    hash;
      // console.log('newURL:', newURL);
      var stateObj = window.history.state;
      window.history.replaceState(stateObj, title, newURL);
      // this.$location.search({url: url});
    }
    else {
      window.history.replaceState(stateObj, title, window.location.pathname);
    }
    this.parseXSV();
  }

  loadURLXSV(XSVURL) {
    var that = this;
    this.XSVURL = XSVURL;
    this.$http.get(XSVURL, {withCredentials: false}).then(
      function(result) {
        // console.log('loadURLXSV success', result.data);
        that.loadSourceXSV(result.data, XSVURL, XSVURL);
      },
      function(error) {
        console.log('loadURLXSV error', error);
        that.setErrorXSV('Error loading URL ' + XSVURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  loadSourceXSVItem(source, title, url) {
    if (source) {
      this.loadSourceXSV(source, title, url);
    }
    else {
      this.loadURLXSV(url);
    }
  }

  loadFileXSV(file) {
    var that = this;
    if (file) {
      if (!file.$error) {
        var reader = new FileReader();
        var blobText = '';
        reader.addEventListener("loadend", function() {
          blobText = reader.result;
          that.loadSourceXSV(blobText, file.name);
        });
        reader.readAsText(file);
      }
    }
  }


  exportXSV(xsvType) {
    var delimiter = (xsvType === 'tsv') ? '\t' : ',';
    var config = {
      quotes: false,
      quoteChar: '"',
      delimiter: delimiter,
      header: true,
      newline: "\n"
    };

    var gridData = _.map(this.gridOptions.data, function(row) {
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

  exportCSV() {
    this.exportXSV('csv');
  }


  exportTSV() {
    this.exportXSV('tsv');
  }


  // Grid stuff

  isAutocompleteColumn(f) {
    var result = f !== 'iri label' && !this.isDerivedLabelColumn(f);
    return result;
  }

  isEditableColumn(f) {
    var result = f === 'iri label' || !this.isDerivedLabelColumn(f);
    return result;
  }

  isDerivedLabelColumn(f) {
    var result = f.endsWith(' label');
    return result;
  }

  setupGrid() {
    var that = this;

    this.gridApi = null;
    this.gridOptions = {
      // rowHeight: 58,
      enableCellSelection: false,
      // rowEditWaitInterval: -1,
      enableCellEdit: false,
      enableCellEditOnFocus: false,
      multiSelect: false,
    };

    this.$scope.getTerm = angular.bind(this, this.getTerm);
    this.$scope.termSelected = angular.bind(this, this.termSelected);
    this.$scope.modelOptions = {
      debounce: {
        default: 500,
        blur: 250
      },
      getterSetter: true
    };

    this.lastCellEdited = null;
    this.gridOptions.onRegisterApi = function(gridApi) {
      that.gridApi = gridApi;
      that.$scope.gridApi = gridApi;

      gridApi.edit.on.afterCellEdit(that.$scope, function(rowEntity, colDef, newValue, oldValue) {
        that.lastCellEdited = 'edited row id:' + rowEntity.id + ' Column:' + colDef.name + ' newValue:' + newValue + ' oldValue:' + oldValue;
        // that.$scope.$apply();
      });

      that.$timeout(function() {
        that.gridApi.core.handleWindowResize();
      }, 0);
    };
  }
}


MainController.$inject = ['$scope', '$resource', '$http', '$timeout', '$location',
                          'uiGridConstants', 'uiGridEditConstants'];
export default angular.module('app.maincontroller', [])
  .controller('MainController', MainController)
  .name;
