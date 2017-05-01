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
  constructor($scope, $rootScope, $http, $timeout, $location, $anchorScroll, uiGridConstants, uiGridEditConstants, session) {
    var that = this;
    this.name = 'Bogus property for unit testing';
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.$anchorScroll = $anchorScroll;
    this.uiGridConstants = uiGridConstants;
    this.uiGridEditConstants = uiGridEditConstants;
    this.examplesPattern = null;
    //   {
    //     url: 'examples/exposure_to_chemical.yaml',
    //     title: 'Pattern: Exposure to Chemical (Local)',
    //     type: 'yaml'
    //   },
    //   {
    //     url: 'examples/abnormalLevelOfChemicalInEntity.yaml',
    //     title: 'Pattern: Abnormal Level of Chemical in Entity (Local)',
    //     type: 'yaml'
    //   },
    //   {
    //     url: 'examples/exposure_to_levels_in_medium.yaml',
    //     title: 'Pattern: Exposure to Levels in Medium (Local)',
    //     type: 'yaml'
    //   },
    //   {
    //     url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/patterns/exposure_to_chemical.yaml',
    //     title: 'Pattern: Exposure to Chemical (Remote)',
    //     type: 'yaml'
    //   },
    //   {
    //     url: 'https://raw.githubusercontent.com/obophenotype/upheno/master/src/patterns/abnormalLevelOfChemicalInEntity',
    //     title: 'Pattern: Abnormal Level of Chemical in Entity (Remote)',
    //     type: 'yaml'
    //   },
    //   {
    //     url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/patterns/exposure_to_levels_in_medium.yaml',
    //     title: 'Pattern: Exposure to Levels in Medium (Remote)',
    //     type: 'yaml'
    //   }
    // ];
    this.examplesXSV = null;
    // [
    //   {
    //     url: 'examples/exposure_to_chemical.csv',
    //     title: 'Exposure to Chemical CSV (Local)',
    //     type: 'csv'
    //   },
    //   {
    //     url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/ontology/modules/exposure_to_chemical.csv',
    //     title: 'Exposure to Chemical CSV (Remote)',
    //     type: 'csv'
    //   },
    //   {
    //     url: 'https://raw.githubusercontent.com/monarch-initiative/hpo-annotation-data/82ffee0d369b445bea04eafcd54e242cae29e546/rare-diseases/annotated/OMIM-154400.tab?token=ACVkebM8gDm2c0fImV7zau54Td4bUTl1ks5ZCdI7wA%3D%3D',
    //     title: 'HPO TSV ACROFACIAL DYSOSTOSIS 1 (Remote)',
    //     type: 'tsv'
    //   },
    //   {
    //     url: 'https://gist.githubusercontent.com/DoctorBud/8d2f7e33d0055c13f310f1e767225ffa/raw/25041c5926ac90977f8c6a86523fe1a19133eb5d/genetest.tsv',
    //     title: 'HPO TSV Fake Debugging Example (Remote)',
    //     type: 'tsv'
    //   }
    // ];

    this.exportedXSV = null;
    this.session = session;

    function completeInitialization() {
      session.showPatternSource = false;
      session.showPatternParsed = false;
      that.setErrorPattern(null);
      session.patternURL = null;

      if (session.parsedConfig.patternless) {
        // console.log('patternless===true');
      }
      else {
        if (session.parsedConfig.defaultPatterns) {
          that.examplesPattern = session.parsedConfig.defaultPatterns;
        }
        if (that.examplesPattern.length > 0) {
          session.defaultpatternURL = that.examplesPattern[0].url;
        }
      }

      session.showXSVSource = false;
      session.showXSVParsed = false;
      session.sourceXSV = '';
      session.titleXSV = '';
      session.errorMessageXSV = null;
      that.setErrorXSV(null);

      session.XSVURL = null;
      if (session.parsedConfig.defaultXSVs) {
        that.examplesXSV = session.parsedConfig.defaultXSVs;
      }
      session.defaultXSVURL = null;

      if (that.examplesXSV && that.examplesXSV.length > 0) {
        session.defaultXSVURL = that.examplesXSV[0].url;
      }

      that.parsedConfig();
    }

    if (session.initialized) {
      // console.log('session.initialized');
      // completeInitialization();
    }
    else {
      console.log('!session.initialized');
      that.$rootScope.$on('parsedConfig', completeInitialization);
    }

    this.$scope.$watch('editorCtrl.session.filePattern', function () {
      that.loadFilePattern(that.session.filePattern);
    });
    this.$scope.$watch('editorCtrl.session.fileXSV', function () {
      that.loadFileXSV(that.session.fileXSV);
    });

    this.setupGrid();
  }

  debugFormat(o) {
    return JSON.stringify(Object.keys(o));
  }

  getCellTitle() {
    var result = '';
    if (this.gridApi) {
      var cell = this.gridApi.cellNav.getFocusedCell();
      if (cell) {
        result = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
      }
    }

    return result;
  }

  getCellURL() {
    var result = '';
    if (this.gridApi) {
      var cell = this.gridApi.cellNav.getFocusedCell();
      if (cell) {
        var colName = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
        var row = this.gridApi.cellNav.getFocusedCell().row.entity;
        var acEntry = this.session.autocompleteRegistry[colName];
        if (acEntry) {
          var colId = row[acEntry.idColumn];

          if (colId) {
            result = acEntry.iriPrefix + colId.replace(':', '_');
          }
        }
        else {
          result = 'http://www.ebi.ac.uk/ols/search?q=' + encodeURI(row[colName]);
        }
      }
    }

    return result;
  }

  getCellDetails() {
    var result = '';
    if (this.gridApi) {
      var cell = this.gridApi.cellNav.getFocusedCell();
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
    }

    return result;
  }

  getTerm(rowEntity, colName, val) {
    var acEntry = this.session.autocompleteRegistry[colName];
    var oldValue = rowEntity[colName];

    if (acEntry.labelColumn) {
      if (val === oldValue) {
        val = rowEntity[acEntry.labelColumn];
      }
      oldValue = rowEntity[acEntry.labelColumn];
    }

    if (acEntry && acEntry.lookup_type === 'golr') {
      return this.session.golrLookup(colName, oldValue, val, acEntry);
    }
    else if (acEntry && acEntry.lookup_type === 'ols') {
      return this.session.olsLookup(colName, oldValue, val, acEntry);
    }
    else if (acEntry && acEntry.lookup_type === 'inline') {
      return this.session.inlineLookup(colName, oldValue, val, acEntry);
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
      if (acEntry) {
        if (acEntry.idColumn) {
          cell.row.entity[acEntry.idColumn] = cellValue.id;
        }
        else {
          cell.row.entity[cellName] = cellValue.id;
        }
        if (acEntry.labelColumn) {
          cell.row.entity[acEntry.labelColumn] = cellValue.name;
        }
      }
      else {
        cell.row.entity[cellName] = cellValue.id;
        if (cellValue.label) {
          var labelField = (cellName + ' label');
          cell.row.entity[labelField] = cellValue.name;
        }
      }
    }
    else {
      cell.row.entity[cellName] = cellValue;
    }

    // console.log('termSelected', acEntry, cellName, cellValue, cell.row.entity);
    var e = cell.row.entity;
    if (!e['IRI label'] || e['IRI label'].length === 0) {
      if (e.beer && e.yeast && e.anatomy) {
        cell.row.entity['IRI label'] = '' + e['beer label'] + ' beer with ' + e['yeast label'] + ' from ' + e['anatomy label'];
      }
    }
    this.$scope.$broadcast(this.uiGridEditConstants.events.END_CELL_EDIT);
  }

  convertIDToNumber(id) {
    var prefix = this.session.parsedConfig.IRIGeneration.prefix;

    var result = 0;
    if (id.indexOf(prefix) === 0) {
      id = id.slice(prefix.length + 1);
      result = parseInt(id, 10);
    }
    else {
      console.log('...ERROR in id', id);
    }

    return result;
  }


  convertNumberToID(number) {
    var prefix = this.session.parsedConfig.IRIGeneration.prefix;
    number = '000000' + number;
    var result = prefix + ':' + number.slice(number.length - 6);
    return result;
  }

  addRow() {
    var that = this;

    var topRow;
    if (this.session.rowData.length > 0) {
      topRow = this.session.rowData[0];
    }
    else {
      topRow = null;
    }


    var newRow;
    var iriGeneration = this.session.parsedConfig.IRIGeneration;
    if (iriGeneration) {
      var selRow = null;
      var lastIRINumber = this.session.parsedConfig.IRIGeneration.counter;

      newRow = {};

      ++lastIRINumber;

      newRow.IRI = this.convertNumberToID(lastIRINumber);
    }
    else {
      newRow = {};

      if (topRow) {
        newRow['Disease ID'] = topRow['Disease ID'];
        newRow['Disease Name'] = topRow['Disease Name'];
      }
    }

    this.session.rowData.unshift(newRow);
    // this.gridApi.core.handleWindowResize();

    this.$timeout(function() {
      var rows = that.$scope.gridApi.grid.getVisibleRows();
      // var rows = that.gridOptions.data;
      var row = rows[0];
      // $scope.gridOptions.data[rowIndex], $scope.gridOptions.columnDefs[colIndex]);

      // that.$anchorScroll('bottom_of_page');

      that.$scope.gridApi.cellNav.scrollToFocus(
        row.entity,
        that.$scope.gridApi.grid.columns[6]);

      that.$timeout(function() {
        // that.$anchorScroll.yOffset = -800;
        that.$anchorScroll('scroll_anchor_' + row.uid);
      }, 100);
    }, 100);
  }

  // Config stuff

  setErrorConfig(error) {
    this.session.errorMessageConfig = error;
    this.session.titleConfig = '';
    this.session.sourceConfig = '';
    this.session.parsedConfig = null;
  }

  parsedConfig() {
    var that = this;
    var searchParams = that.$location.search();
    var patternUrl;
    if (searchParams.yaml) {
      patternUrl = searchParams.yaml;
    }
    else if (that.session.defaultpatternURL) {
      patternUrl = that.session.defaultpatternURL;
    }

    function patternLoaded() {
      var xsvUrl;
      if (searchParams.xsv) {
        xsvUrl = searchParams.xsv;
      }
      else if (that.defaultXSVURL) {
        xsvUrl = that.defaultXSVURL;
      }
      if (xsvUrl) {
        that.loadURLXSV(xsvUrl);
      }
    }

    if (patternUrl) {
      that.loadURLPattern(patternUrl, patternLoaded);
    }
    else {
      patternLoaded();
    }
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

  stripQuotes(s) {
    return s.replace(/^'/, '').replace(/'$/, '');
  }

  loadSourcePattern(source, title, url, continuation) {
    var that = this;
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

    this.session.parsePattern(function() {
      console.log('parsedPattern', that.session.parsedPattern);
      var fields = [];
      _.each(that.session.parsedPattern.vars, function(v, k) {
        fields.push(that.stripQuotes(v));
        fields.push(that.stripQuotes(v) + ' label');
      });
      that.session.columnDefs = that.generateColumnDefsFromFields(fields);
      that.session.rowData = [];
      that.gridOptions.columnDefs = that.session.columnDefs;
      that.gridOptions.data = that.session.rowData;
      if (continuation) {
        continuation();
      }
      that.$timeout(function() {
        that.gridApi.core.handleWindowResize();
      }, 0);
    });
  }

  loadURLPattern(patternURL, continuation) {
    var that = this;
    this.session.patternURL = patternURL;
    this.$http.get(patternURL, {withCredentials: false}).then(
      function(result) {
        that.loadSourcePattern(result.data, patternURL, patternURL, continuation);
      },
      function(error) {
        that.setErrorPattern('Error loading URL ' + patternURL + '\n\n' + JSON.stringify(error));
        continuation();
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

  generateColumnDefsFromFields(fields) {
    var that = this;
    function sanitizeColumnName(f) {
      return f.replace('(', '_').replace(')', '_');
    }

    var fieldsWithIRI = angular.copy(fields);
    // fieldsWithIRI.unshift('IRI label');
    // fieldsWithIRI.unshift('IRI');

    var columnDefs = _.map(fieldsWithIRI, function(f) {
      var sanitizedName = sanitizeColumnName(f);
      var result = {
        name: sanitizedName,
        field: sanitizedName,
        displayName: f,
        minWidth: 100,
        maxWidth: 120,
        enableCellEdit: false,
        enableCellEditOnFocus: false
      };

      if (sanitizedName.indexOf(' label') === -1) {
        result.minWidth = 90;
        result.maxWidth = 90;
      }

      if (that.isAutocompleteColumn(f)) {
        result.enableCellEditOnFocus = true;
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
      }

      return result;
    });

    var lastCol = columnDefs[columnDefs.length - 1];
    if (lastCol && (!lastCol.name || lastCol.name.length === 0)) {
      columnDefs.length = columnDefs.length - 1;
    }

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

  compareColumnDefs(patternColumns, xsvColumns) {
    var result = true;

    if (patternColumns.length + 2 !== xsvColumns.length) {
      console.log('#compareColumnDefs length mismatch:', patternColumns.length + 2, xsvColumns.length);
      result = false;
    }
    else {
      console.log('compare', patternColumns, xsvColumns.slice(2));
      result = _.isEqual(patternColumns, xsvColumns.slice(2));
    }
    return result;
  }

  parseXSV() {
    var that = this;
    this.session.parseXSV(function() {
      var xsvColumns = that.generateColumnDefsFromFields(that.session.parsedXSV.meta.fields);

      var columnsMatch = true;
      if (that.session.parsedPattern) {
        console.log('Pattern used. Verify conformance with XSV',
          that.session.columnDefs,
          xsvColumns);

        if (that.compareColumnDefs(that.session.columnDefs, xsvColumns)) {
          console.log('#Consistent column defs in Pattern vs XSV');
        }
        else {
          console.log('#Inconsistent column defs in Pattern vs XSV');
          columnsMatch = false;
        }
      }
      else {
        // console.log('No pattern used. Generate columns from XSV', xsvColumns);
      }

      that.session.columnDefs = xsvColumns;

      if (columnsMatch) {
        that.session.rowData = that.generateRowDataFromXSV(that.session.parsedXSV.data);

        that.session.rowData.reverse();
        that.gridOptions.columnDefs = that.session.columnDefs;
        that.gridOptions.data = that.session.rowData;
        that.$timeout(function() {
          that.gridApi.core.handleWindowResize();
        }, 0);
      }
      else {
        that.session.rowData = [];
        that.setErrorXSV('Error: XSV Columns do not match Pattern Columns');
      }
    });
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
      rowHeight: 80,
      enableCellSelection: false,
      // rowEditWaitInterval: -1,
      enableCellEdit: false,
      enableCellEditOnFocus: false,
      multiSelect: false,
      rowTemplate: 'TERowTemplate'
    };

    this.$scope.noResults = false;
    this.$scope.debugFormat = angular.bind(this, this.debugFormat);
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

      gridApi.edit.on.beginCellEdit(that.$scope, function(rowEntity, colDef) {
        // console.log("beginCellEdit: " + angular.toJson(colDef.field));
      });

      gridApi.edit.on.afterCellEdit(that.$scope, function(rowEntity, colDef, newValue, oldValue) {
        // console.log("afterCellEdit: " + angular.toJson(colDef.field));
        that.lastCellEdited = '[' + rowEntity.iri + '][' + colDef.name + ']: ' + oldValue + '-->' + newValue;
      });

      gridApi.edit.on.cancelCellEdit(that.$scope, function(rowEntity, colDef) {
        // console.log("cancelCellEdit: " + angular.toJson(colDef.field));
      });

      gridApi.cellNav.on.viewPortKeyDown(that.$scope, function(event, newRowCol) {
          var row = newRowCol.row;
          var col = newRowCol.col;
          if (event.keyCode === 32) {
            that.$scope.gridApi.cellNav.scrollToFocus(
              row.entity,
              that.$scope.gridApi.grid.columns[that.$scope.gridApi.grid.columns.length - 1]);
          }
      });

      gridApi.cellNav.on.navigate(that.$scope, function(newRowCol, oldRowCol) {
          // console.log('navigate', newRowCol, oldRowCol);
          that.$scope.$broadcast(that.uiGridEditConstants.events.END_CELL_EDIT);
          that.$scope.noResults = false;
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

EditorController.$inject = ['$scope', '$rootScope', '$http', '$timeout', '$location', '$anchorScroll',
                          'uiGridConstants', 'uiGridEditConstants', 'session'];

