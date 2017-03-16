/* global angular */

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

export default class EditorController {
  // constructor arglist must match invocation in app.js
  constructor($scope, $http, $timeout, $location, uiGridConstants, uiGridEditConstants, session) {
    var that = this;
    this.name = 'Bogus property for unit testing';
    this.$scope = $scope;
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.uiGridConstants = uiGridConstants;
    this.uiGridEditConstants = uiGridEditConstants;
    this.examplesPattern = [
      {
        url: 'examples/exposure_to_change_in_levels.yaml',
        title: 'Environmental Conditions Pattern (Local)',
        type: 'yaml'
      },
      {
        url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/patterns/exposure_to_change_in_levels.yaml',
        title: 'Environmental Conditions Pattern (Remote)',
        type: 'yaml'
      }
    ];
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
    this.exportedXSV = null;

    this.session = session;
    if (session.initialized) {
      // console.log('session.initialized');
    }
    else {
      // console.log('!session.initialized');
      session.showPatternSource = false;
      session.showPatternParsed = false;
      this.setErrorPattern(null);
      session.patternURL = null;
      session.defaultpatternURL = null; // this.examplesPattern[0].url;

      session.defaultConfigURL = './config.yaml';

      session.showXSVSource = false;
      session.showXSVParsed = false;
      session.sourceXSV = '';
      session.titleXSV = '';
      session.errorMessageXSV = null;
      this.setErrorXSV(null);

      session.XSVURL = null;
      session.defaultXSVURL = null; // this.examplesXSV[0].url;

      var searchParams = this.$location.search();
      if (searchParams.config) {
        var config = searchParams.config;
        that.loadURLConfig(config);
      }
      else if (that.session.defaultConfigURL) {
        that.loadURLConfig(that.session.defaultConfigURL);
      }
    }
    this.$scope.$watch('editorCtrl.session.filePattern', function () {
      that.loadFilePattern(that.session.filePattern);
    });
    this.$scope.$watch('editorCtrl.session.fileXSV', function () {
      that.loadFileXSV(that.session.fileXSV);
    });

    this.setupGrid();
  }

  getCellTitle() {
    var cell = this.gridApi.cellNav.getFocusedCell();
    var result = '';
    if (cell) {
      result = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
    }

    return result;
  }

  getCellURL() {
    var cell = this.gridApi.cellNav.getFocusedCell();
    var result = '';
    if (cell) {
      var colName = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
      var row = this.gridApi.cellNav.getFocusedCell().row.entity;
      var acEntry = this.session.autocompleteRegistry[colName];
      if (acEntry) {
        var colId = row[acEntry.idColumn];

        result = acEntry.iriPrefix + colId.replace(':', '_');
      }
      else {
        result = 'http://www.ebi.ac.uk/ols/search?q=' + encodeURI(row[colName]);
      }
    }

    return result;
  }

  getCellDetails() {
    var cell = this.gridApi.cellNav.getFocusedCell();
    var result = '';
    if (cell) {
      var colName = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
      var row = this.gridApi.cellNav.getFocusedCell().row.entity;
      var acEntry = this.session.autocompleteRegistry[colName];
      if (acEntry) {
        var colId = row[acEntry.idColumn];
        var colLabel = row[acEntry.labelColumn];

        result = colLabel + ' (' + colId + ')';
      }
      else {
        result = colName + ' (' + row[colName] + ')\n';
      }
    }

    return result;
  }

  getTerm(colName, oldValue, val) {
    var acEntry = this.session.autocompleteRegistry[colName];
    // console.log('getTerm', colName, oldValue, val, acEntry, this.session.autocompleteRegistry);
    if (acEntry && acEntry.lookup_type === 'golr') {
      return this.session.golrLookup(colName, oldValue, val, acEntry);
    }
    else if (acEntry && acEntry.lookup_type === 'ols') {
      return this.session.olsLookup(colName, oldValue, val, acEntry);
    }
    else {
      return this.session.monarchLookup(colName, oldValue, val, acEntry);
    }
  }

  termSelected(item, model, label, event) {
    var cellNav = this.gridApi.cellNav;
    var cell = cellNav.getFocusedCell();
    var cellName = cell.col.colDef.name;
    var cellValue = cell.row.entity[cellName];

    if (this.isAutocompleteColumn(cellName)) {
      var acEntry = this.session.autocompleteRegistry[cellName];
      // console.log('termSelected', acEntry, cellName, cellValue);
      if (acEntry) {
        if (acEntry.idColumn) {
          cell.row.entity[acEntry.idColumn] = cellValue.id;
        }
        else {
          cell.row.entity[cellName] = cellValue.id;
        }
        if (acEntry.labelColumn) {
          cell.row.entity[acEntry.labelColumn] = cellValue.label[0];
        }
      }
      else {
        cell.row.entity[cellName] = cellValue.id;
        if (cellValue.label) {
          var labelField = (cellName + ' label');
          cell.row.entity[labelField] = cellValue.label[0];
        }
      }
    }
    else {
      cell.row.entity[cellName] = cellValue;
    }

    this.$scope.$broadcast(this.uiGridEditConstants.events.END_CELL_EDIT);
  }

  addRow() {
    console.log('addRow NYI');
    var selCell = this.gridApi.cellNav.getFocusedCell();
    var selRow = null;
    if (selCell) {
      selRow = selCell.row.entity;
    }
    else if (this.session.rowData.length > 0) {
      selRow = this.session.rowData[this.session.rowData.length - 1];
    }
    else {
      selRow = {};
    }
    var newRow = angular.copy(selRow);
    newRow.iri = '';
    newRow['iri label'] = '';
    this.session.rowData.push(newRow);
  }

  // Config stuff

  setErrorConfig(error) {
    this.session.errorMessageConfig = error;
    this.session.titleConfig = '';
    this.session.sourceConfig = '';
    this.session.parsedConfig = null;
  }

  generateDefaultACRegistry() {
    var that = this;
    that.session.autocompleteRegistry = {};
    _.each(that.session.parsedConfig.globalAutocomplete, function(entry, columnName) {
      that.session.autocompleteRegistry[columnName] = {
        iriPrefix: 'http://purl.obolibrary.org/obo/',
        idColumn: columnName,
        labelColumn: entry.label,
        root_class: entry.root_class,
        lookup_type: entry.lookup_type
      };

      if (entry.label) {
        that.session.autocompleteRegistry[entry.label] = {
          iriPrefix: 'http://purl.obolibrary.org/obo/',
          idColumn: columnName,
          labelColumn: entry.label,
          root_class: entry.root_class,
          lookup_type: entry.lookup_type
        };
      }
    });
  }

  parseConfig() {
    var renderElement = document.getElementById('ConfigParsed');

    try {
      var doc = yaml.safeLoad(this.session.sourceConfig);
      this.session.parsedConfig = doc;
      // console.log('parseConfig', this.session.parsedConfig);

      var that = this;
      this.generateDefaultACRegistry();
      this.session.initialized = true;

      var searchParams = this.$location.search();
      if (searchParams.yaml) {
        var url = searchParams.yaml;
        this.loadURLPattern(url);
      }
      else if (this.session.defaultpatternURL) {
        this.loadURLPattern(this.session.defaultpatternURL);
      }
      if (searchParams.xsv) {
        var xsv = searchParams.xsv;
        this.loadURLXSV(xsv);
      }
      else if (this.session.defaultXSVURL) {
        this.loadURLXSV(this.session.defaultXSVURL);
      }
    }
    catch (e) {
      console.log('error', e);
    }
  }

  loadSourceConfig(source, title, url) {
    this.session.sourceConfig = source;
    this.session.titleConfig = title;
    this.session.configURL = url;
    this.session.errorMessageConfig = null;
    if (url) {
      var search = this.$location.search();
      search.config = url;
      this.$location.search(search);
    }
    else {
      this.$location.search({});
    }
    this.parseConfig();
  }

  loadURLConfig(configURL) {
    var that = this;
    this.session.configURL = configURL;
    this.$http.get(configURL, {withCredentials: false}).then(
      function(result) {
        that.loadSourceConfig(result.data, configURL, configURL);
      },
      function(error) {
        that.setErrorConfig('Error loading URL ' + configURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  loadSourceConfigItem(source, title, url) {
    if (source) {
      this.loadSourceConfig(source, title, url);
    }
    else {
      this.loadURLConfig(url);
    }
  }

  loadFileConfig(file) {
    var that = this;
    if (file) {
      if (!file.$error) {
        var reader = new FileReader();
        var blobText = '';
        reader.addEventListener("loadend", function() {
          blobText = reader.result;
          that.loadSourceConfig(blobText, file.name);
        });
        reader.readAsText(file);
      }
    }
  }


  // Pattern stuff

  setErrorPattern(error) {
    if (error) {
      console.log('#setErrorPattern', error);
    }
    this.session.errorMessagePattern = error;
    this.session.titlePattern = '';
    this.session.sourcePattern = '';
    this.session.parsedPattern = null;
  }

  parsePattern() {
    var that = this;
    var renderElement = document.getElementById('PatternParsed');

    try {
      var doc = yaml.safeLoad(this.session.sourcePattern);
      this.session.parsedPattern = doc;

      // console.log('parsePattern', this.session.sourcePattern, this.session.parsedPattern, that.session.parsedConfig);
      // Build the autocomplete Registry from the pattern yaml and the config yaml

      this.generateDefaultACRegistry();
      _.each(this.session.parsedPattern.vars,
        function(classname, key) {
          if (that.session.parsedPattern) {
            classname = classname.replace(/^'/, '').replace(/'$/, '');
            var curie = that.session.parsedPattern.classes[classname];
            if (!curie) {
              that.setErrorPattern('Error in pattern for var "' + classname + '"\n' + JSON.stringify(that.session.parsedPattern, null, 2));
            }
            else {
              var curiePrefix = curie.split(':')[0];
              var configEntry = that.session.parsedConfig[curiePrefix] ||
                    {
                      autocomplete: 'ols',
                      iriPrefix: 'http://purl.obolibrary.org/obo/'
                    };

              var labelColumn = key + ' label';
              that.session.autocompleteRegistry[key] = {
                idColumn: key,
                labelColumn: labelColumn,
                root_class: curie,
                lookup_type: configEntry.autocomplete,
                iriPrefix: configEntry.iriPrefix,
                curiePrefix: curiePrefix
              };
              that.session.autocompleteRegistry[labelColumn] = {
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
    }
    catch (e) {
      console.log('error', e);
    }
  }

  loadSourcePattern(source, title, url) {
    this.session.sourcePattern = source;
    this.session.titlePattern = title;
    this.session.patternURL = url;
    this.session.errorMessagePattern = null;
    if (url) {
      var search = this.$location.search();
      search.yaml = url;
      this.$location.search(search);
    }
    else {
      this.$location.search({});
    }
    this.parsePattern();
  }

  loadURLPattern(patternURL) {
    var that = this;
    this.session.patternURL = patternURL;
    this.$http.get(patternURL, {withCredentials: false}).then(
      function(result) {
        that.loadSourcePattern(result.data, patternURL, patternURL);
      },
      function(error) {
        that.setErrorPattern('Error loading URL ' + patternURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  loadSourcePatternItem(source, title, url) {
    if (source) {
      this.loadSourcePattern(source, title, url);
    }
    else {
      this.loadURLPattern(url);
    }
  }

  loadFilePattern(file) {
    var that = this;
    if (file) {
      if (!file.$error) {
        var reader = new FileReader();
        var blobText = '';
        reader.addEventListener("loadend", function() {
          blobText = reader.result;
          that.loadSourcePattern(blobText, file.name);
        });
        reader.readAsText(file);
      }
    }
  }


// XSV stuff

  setErrorXSV(error) {
    this.session.errorMessageXSV = error;
    this.session.titleXSV = '';
    this.session.sourceXSV = '';
    this.session.parsedXSV = null;
  }

  generateColumnDefsFromXSV(fields) {
    var that = this;
    function sanitizeColumnName(f) {
      return f.replace('(', '_').replace(')', '_');
    }

    var columnDefs = _.map(fields, function(f) {
      var sanitizedName = sanitizeColumnName(f);
      var result = {
        name: sanitizedName,
        field: sanitizedName,
        displayName: f,
        minWidth: 150,
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

    return columnDefs;
  }

  generateRowDataFromXSV(data) {
    var rowData = _.map(data, function(row) {
      // Not much going on here; this is just an identity mapping for now
      // But other types of transformation might be necessary in the future.
      return row;
    });

    return rowData;
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
        that.session.parsedXSV = results; // .data;
        that.session.columnDefs = that.generateColumnDefsFromXSV(results.meta.fields);
        that.session.rowData = that.generateRowDataFromXSV(results.data);
        that.gridOptions.columnDefs = that.session.columnDefs;
        that.gridOptions.data = that.session.rowData;
        that.gridApi.core.handleWindowResize();
      }, 0);
    };

    Papa.parse(this.session.sourceXSV, config);
  }

  loadSourceXSV(source, title, url) {
    this.session.sourceXSV = source;
    this.session.titleXSV = title;
    this.session.XSVURL = url;
    this.session.errorMessageXSV = null;
    if (url) {
      var search = this.$location.search();
      search.xsv = url;
      this.$location.search(search);
    }
    else {
      this.$location.search({});
    }
    this.parseXSV();
  }

  loadURLXSV(XSVURL) {
    var that = this;
    this.session.XSVURL = XSVURL;
    this.$http.get(XSVURL, {withCredentials: false}).then(
      function(result) {
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



  // Grid stuff

  isAutocompleteColumn(f) {
    var acEntry = this.session.autocompleteRegistry[f];
    var result = !!acEntry;
    // console.log('isAutocompleteColumn', f, result);
    return result;
  }

  isEditableColumn(f) {
    var acEntry = this.session.autocompleteRegistry[f];
    var result = !acEntry;
    // console.log('isEditableColumn', f, result);
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
        that.lastCellEdited = '[' + rowEntity.iri + '][' + colDef.name + ']: ' + oldValue + '-->' + newValue;
      });

      that.$timeout(function() {
        if (that.session.columnDefs) {
          that.gridOptions.columnDefs = that.session.columnDefs;
          that.gridOptions.data = that.session.rowData;
        }
        that.gridApi.core.handleWindowResize();
      }, 0);
    };
  }
}

EditorController.$inject = ['$scope', '$http', '$timeout', '$location',
                          'uiGridConstants', 'uiGridEditConstants', 'session'];

