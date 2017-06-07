/* global angular */

import _ from 'lodash';
import yaml from 'js-yaml';
import Papa from 'papaparse';
const uuidv4 = require('uuid/v4');  // https://github.com/kelektiv/node-uuid

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
  constructor($scope, $rootScope, $http, $timeout, $location, $anchorScroll, $window, uiGridConstants, uiGridEditConstants, session) {
    var that = this;
    this.name = 'Bogus property for unit testing';
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.$anchorScroll = $anchorScroll;
    this.$window = $window;
    this.uiGridConstants = uiGridConstants;
    this.uiGridEditConstants = uiGridEditConstants;
    this.examplesPattern = null;
    this.examplesXSV = null;

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
          session.defaultPatternURL = that.examplesPattern[0].url;
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

      // if (that.examplesXSV && that.examplesXSV.length > 0) {
      //   session.defaultXSVURL = that.examplesXSV[0].url;
      // }

      that.parsedConfig();
    }

    if (session.initialized) {
      // console.log('session.initialized');
      completeInitialization();
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


  getRowTitle() {
    var cellNav = this.gridApi.cellNav;
    var cell = cellNav.getFocusedCell();
    var label = '';
    var pattern = this.session.parsedPattern;
    if (cell && pattern) {
      var text = pattern.name.text;
      var vars = pattern.name.vars;

      ({label} = this.applySubstitution(cell.row, text, vars));
    }

    return label;
  }

  getRowURL() {
    var cellNav = this.gridApi.cellNav;
    var cell = cellNav.getFocusedCell();
    var label = '';
    var pattern = this.session.parsedPattern;
    if (cell && pattern) {
      var text = pattern.name.text;
      var vars = pattern.name.vars;

      ({label} = this.applySubstitution(cell.row, text, vars));
    }

    return label;
  }

  getRowDetails() {
    var cellNav = this.gridApi.cellNav;
    var cell = cellNav.getFocusedCell();
    var label = '';
    var pattern = this.session.parsedPattern;
    if (cell && pattern) {
      var text = pattern.name.text;
      var vars = pattern.name.vars;

      ({label} = this.applySubstitution(cell.row, text, vars));
    }

    return label;
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
          result = 'https://www.ebi.ac.uk/ols/search?q=' + encodeURI(row[colName]);
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

  applySubstitution(row, text, vars) {
    var textFragments = text.split('%s');
    var syntheticLabel = '';
    var usedVars = 0;
    for (var i = 0; i < vars.length; ++i) {
      var labelColumnName = vars[i] + ' label';
      var substitution = row.entity[labelColumnName];

      if (substitution) {
        ++usedVars;
      }
      else {
        substitution = '?';
      }
      syntheticLabel += textFragments[i] + substitution;
    }
    syntheticLabel += textFragments[i];

    return {
      label: syntheticLabel,
      complete: (usedVars === vars.length)
    };
  }

  updateIRILabelForRow(row) {
    var that = this;
    if (that.session.parsedPattern && that.session.parsedPattern.name) {
      var text = that.session.parsedPattern.name.text;
      var vars = that.session.parsedPattern.name.vars;

      var {label, complete} = this.applySubstitution(row, text, vars);
      if (complete) {
        row.entity['iri label'] = label;
      }
    }
  }

  termSelected(item, model, label, event) {
    var that = this;
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

    that.updateIRILabelForRow(cell.row);

    // this.$timeout(function() {
    //   that.$scope.gridApi.cellNav.scrollToFocus(
    //     cell.row.entity,
    //     cell.col.colDef);
    //   }, 250);

    //   $scope.gridApi.cellNav.scrollToFocus( row, $scope.gridOptions.columnDefs[colIndex]);

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

  deleteRow(entity) {
    if (this.$window.confirm('Are you sure you want to delete this entry?')) {
      var foundIndex = this.session.rowData.indexOf(entity);
      if (foundIndex >= 0) {
        this.session.rowData.splice(foundIndex, 1);
      }
    }
  }

  openGitHub() {
    var that = this;

    console.log('openGitHub');
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
    var newRow = {};
    var iriGeneration = this.session.parsedConfig.IRIGeneration;
    if (iriGeneration.type === 'uuid') {
      newRow.iri = uuidv4(iriGeneration.prefix);
    }
    else if (iriGeneration.type === 'counter') {
      var lastIRINumber = this.session.parsedConfig.IRIGeneration.counter;

      ++lastIRINumber;

      newRow.iri = this.convertNumberToID(lastIRINumber);
    }
    else {
      if (topRow) {
        newRow['Disease ID'] = topRow['Disease ID'];
        newRow['Disease Name'] = topRow['Disease Name'];
      }
    }

    this.session.rowData.unshift(newRow);
    // this.gridApi.core.handleWindowResize();

    this.$timeout(function() {
      var rows = that.$scope.gridApi.grid.getVisibleRows(); // that.session.rowData;
      var col = that.$scope.gridApi.grid.columns[4];
      var colUID = col.uid;
      var rowUID;
      var row;
      _.each(rows, function(r) {
        if (r.entity === newRow) {
          row = r;
          rowUID = r.uid;
        }
      });
      // var row = rows[0];

      // console.log('row', row, ' col', col);
      // that.$anchorScroll('bottom_of_page');

      that.$timeout(function() {
        that.$anchorScroll.yOffset = 0;
        var anchor = 'scroll_anchor_' + rowUID + '_' + colUID;
        // console.log('anchor', anchor);
        // that.$anchorScroll(anchor);
      }, 10);


      // that.$timeout(function() {
      //   that.$scope.gridApi.cellNav.scrollToFocus(
      //     row.entity,
      //     col.colDef).then(function(rr) {
      //       // console.log('s2f');
      //     });
      // }, 50);

      // that.$scope.gridApi.cellNav.scrollToFocus(
      //   row.entity,
      //   col.colDef).then(function(rr) {
      //     that.$timeout(function() {
      //       that.$anchorScroll.yOffset = 0;
      //       var anchor = 'scroll_anchor_' + rowUID + '_' + colUID;
      //       that.$anchorScroll(anchor);
      //     }, 50);
      //   });

    }, 50);
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
    var patternURL;
    if (searchParams.yaml) {
      patternURL = searchParams.yaml;
    }
    else if (that.session.defaultPatternURL) {
      patternURL = that.session.defaultPatternURL;
    }

    function patternLoaded() {
      // console.log('patternLoaded', searchParams.xsv, that.session.defaultXSVURL);
      var xsvURL;
      if (searchParams.xsv) {
        xsvURL = searchParams.xsv;
      }
      else if (that.session.defaultXSVURL) {
        xsvURL = that.session.defaultXSVURL;
      }
      if (xsvURL) {
        that.loadURLXSV(xsvURL);
      }
      else {
        that.loadNewXSV();
      }
    }

    if (patternURL) {
      that.loadURLPattern(patternURL, patternLoaded);
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
      this.session.titlePattern = '';
      this.session.sourcePattern = '';
      this.session.patternURL = null;
      this.session.parsedPattern = null;
    }
    this.session.errorMessagePattern = error;
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
      // console.log('parsedPattern', that.session.parsedPattern);
      var fields = [];
      _.each(that.session.parsedPattern.vars, function(v, k) {
        fields.push(that.stripQuotes(k));
        fields.push(that.stripQuotes(k) + ' label');
      });

      that.loadNewXSV();
      // that.session.rowData = [];
      // that.gridOptions.data = that.session.rowData;
      that.session.columnDefs = that.generateColumnDefsFromFields(fields, true);
      that.gridOptions.columnDefs = angular.copy(that.session.columnDefs);
      that.setErrorPattern(null);
      that.loadNewXSV();
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
    if (error) {
      this.session.titleXSV = '';
      this.session.sourceXSV = '';
      this.session.parsedXSV = null;
      this.session.XSVURL = null;
    }
  }

  keydown(event) {
    console.log('keydown', event);
  }

  generateColumnDefsFromFields(fields, addIRI) {
    var that = this;
    function sanitizeColumnName(f) {
      return f.replace('(', '_').replace(')', '_');
    }

    var fieldsWithIRI = angular.copy(fields);

    if (addIRI) {
      fieldsWithIRI.unshift('iri label');
      fieldsWithIRI.unshift('iri');
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

      if (f.endsWith(' label')) {
        result.width = 150;
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

  generateRowDataFromXSV(data) {
    let xsvColumns = this.session.columnDefs;
    var rowData = _.map(data, function(row) {
      // Not much going on here; this is just an identity mapping for now
      // But other types of transformation might be necessary in the future.

      var transformedRow = {};
      _.each(xsvColumns, function(columnDef) {
        transformedRow[columnDef.field] = row[columnDef.originalName];
      });

      return transformedRow;
    });

    return rowData;
  }

  compareColumnDefs(patternColumns, xsvColumns) {
    var result = true;

    if (this.session.parsedConfig.patternless) {
      // HPO mode
    }
    else {
      if (patternColumns.length !== xsvColumns.length) {
        console.log('#compareColumnDefs length mismatch:', patternColumns.length + 2, xsvColumns.length);
        result = false;
      }
      else {
        // console.log('compare', patternColumns, xsvColumns);
        result = _.isEqual(patternColumns, xsvColumns);
      }
    }
    return result;
  }

  parseXSV() {
    var that = this;
    this.session.parseXSV(function() {
      var xsvColumns = that.generateColumnDefsFromFields(that.session.parsedXSV.meta.fields);

      var columnsMatch = true;
      if (that.session.parsedPattern) {
        // console.log('Pattern used. Verify conformance with XSV',
        //   that.session.parsedPattern,
        //   that.session.columnDefs,
        //   xsvColumns);

        if (that.compareColumnDefs(that.session.columnDefs, xsvColumns)) {
          // console.log('#Consistent column defs in Pattern vs XSV');
          xsvColumns = that.session.columnDefs;
        }
        else {
          console.log('#Inconsistent column defs in Pattern vs XSV');
          columnsMatch = false;
        }
      }
      else {
        console.log('No pattern used. Generate columns from XSV', xsvColumns, that.session.parsedXSV);
      }

      if (columnsMatch) {
        that.session.columnDefs = xsvColumns;
        that.session.rowData = that.generateRowDataFromXSV(that.session.parsedXSV.data);

        that.session.rowData.reverse();
        that.gridOptions.columnDefs = angular.copy(that.session.columnDefs);
        that.gridOptions.data = that.session.rowData;
        that.$timeout(function() {
          that.gridApi.core.handleWindowResize();
        }, 0);
      }
      else {
        that.$timeout(function() {
          that.loadNewXSV();
          // that.session.rowData = [];
          // that.gridOptions.data = that.session.rowData;
          that.session.columnDefs = angular.copy(that.gridOptions.columnDefs);
          that.setErrorXSV('Error: XSV Columns do not match Pattern Columns');
        }, 0);
      }
    });
  }

  loadNewXSV() {
    // console.log('loadNewXSV', this.session.autocompleteRegistry, this.session.columnDefs);
    var that = this;
    this.session.sourceXSV = 'New XSV';
    this.session.titleXSV = 'New XSV';
    this.session.XSVURL = null;
    this.session.errorMessageXSV = null;

    if (this.session.parsedConfig.patternless) {
      var xsvColumns = this.generateColumnDefsFromFields(this.session.parsedConfig.defaultFields);
      this.session.columnDefs = xsvColumns;
      this.gridOptions.columnDefs = angular.copy(this.session.columnDefs);
    }
    // var newRow = {};
    // _.each(that.session.columnDefs.slice(1), function(colDef) {
    //   newRow[colDef.field] = '';
    // });
    this.session.rowData = [];
    this.gridOptions.data = this.session.rowData;
    // console.log('loadNewXSV', that.session.columnDefs, that.session.rowData);
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

  setSorting(enabled) {
    this.gridOptions.enableSorting = enabled;
    _.each(this.gridOptions.columnDefs, function(columnDef) {
      if (columnDef.cellTemplate !== 'uigridActionCell') {
        columnDef.enableSorting = enabled;
      }
    });
    this.gridApi.core.notifyDataChange(this.uiGridConstants.dataChange.COLUMN);
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
      rowTemplate: 'TERowTemplate',
      // keyDownOverrides: [{keyCode: 27}]
    };

    this.$scope.noResults = false;
    this.$scope.debugFormat = angular.bind(this, this.debugFormat);
    this.$scope.getTerm = angular.bind(this, this.getTerm);
    this.$scope.termSelected = angular.bind(this, this.termSelected);

    this.lastCellEdited = null;
    this.gridOptions.onRegisterApi = function(gridApi) {
      that.gridApi = gridApi;
      that.$scope.gridApi = gridApi;

      gridApi.edit.on.beginCellEdit(that.$scope, function(rowEntity, colDef) {
        // console.log("beginCellEdit: " + angular.toJson(colDef.field));
        that.setSorting(false);
      });

      gridApi.edit.on.afterCellEdit(that.$scope, function(rowEntity, colDef, newValue, oldValue) {
        // console.log("afterCellEdit: " + angular.toJson(colDef.field));
        that.lastCellEdited = '[' + rowEntity.iri + '][' + colDef.name + ']: ' + oldValue + '-->' + newValue;
        that.setSorting(true);
      });

      gridApi.edit.on.cancelCellEdit(that.$scope, function(rowEntity, colDef) {
        // console.log("cancelCellEdit: " + angular.toJson(colDef.field));
        that.setSorting(true);
      });

      gridApi.cellNav.on.viewPortKeyDown(that.$scope, function(event, newRowCol) {
        var row = newRowCol.row;
        var col = newRowCol.col;
        if (event.keyCode === 32) {
          // that.$scope.gridApi.cellNav.scrollToFocus(
          //   row.entity,
          //   that.$scope.gridApi.grid.columns[that.$scope.gridApi.grid.columns.length - 1]);
        }
        else if (event.keyCode === 27) {
          that.$scope.$broadcast(that.uiGridEditConstants.events.CANCEL_CELL_EDIT);
        }
      });

      gridApi.cellNav.on.navigate(that.$scope, function(newRowCol, oldRowCol) {
          // console.log('navigate', newRowCol, oldRowCol);
          that.$scope.$broadcast(that.uiGridEditConstants.events.CANCEL_CELL_EDIT);
          that.$scope.noResults = false;
      });

      that.$timeout(function() {
        if (that.session.columnDefs) {
          that.gridOptions.columnDefs = angular.copy(that.session.columnDefs);
          that.gridOptions.data = that.session.rowData;
        }
        that.gridApi.core.handleWindowResize();
      }, 0);
    };
  }
}

EditorController.$inject = ['$scope', '$rootScope', '$http', '$timeout', '$location', '$anchorScroll', '$window',
                          'uiGridConstants', 'uiGridEditConstants', 'session'];

