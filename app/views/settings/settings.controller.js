/* global angular */

import _ from 'lodash';

function getLength(rowData) {
  return rowData ? rowData.length : -1;
}

export default class SettingsController {

  stripQuotes(s) {
    return s.replace(/^'/, '').replace(/'$/, '');
  }

  loadSourcePattern(source, title, url, continuation) {
    var that = this;
    this.session.parsePattern(
      source,
      title,
      url,
      function() {
        console.log('parsePattern', that.session.parsedPattern, getLength(that.session.$localStorage.rowData));
        // // that.loadNewXSV('THREE');

        var fields = [];
        _.each(that.session.parsedPattern.vars, function(v, k) {
          fields.push(that.stripQuotes(k));
          fields.push(that.stripQuotes(k) + '_label');
        });

        that.session.columnDefs = that.session.generateColumnDefsFromFields(fields, true);
        // that.gridOptions.columnDefs = angular.copy(that.session.columnDefs);
        // that.gridOptions.data = that.session.rowData;
        // that.setErrorPattern(null);
        that.session.updateLocation();
      },
      function(errors) {
        that.setErrorPattern(errors);
      }
    );
  }

  parsedConfig() {
    var that = this;
    console.log('SettingsController parsedConfig this.session',
      this.session.defaultPatternURL,
      this.session.patternURL);

    var searchParams = that.$location.search();
    const savedRowData = that.session.$localStorage.rowData;
    const savedConfigURL = that.session.$localStorage.configURL;
    const savedPatternURL = that.session.$localStorage.patternURL;

    var patternURL;
    if (that.session.parsedConfig.patternless) {
      console.log('...patternless');  
    }
    else if (searchParams.yaml) {
      patternURL = searchParams.yaml;
    }
    else if (savedConfigURL && savedConfigURL === that.session.configURL &&
             savedPatternURL && savedPatternURL.length > 0) {
      // console.log('patternURL', savedConfigURL, that.session.configURL, savedPatternURL);
      patternURL = savedPatternURL;
    }
    else if (that.defaultPatternURL) {
      patternURL = that.defaultPatternURL;
    }

    if (patternURL) {
      this.$http.get(patternURL, {withCredentials: false}).then(
        function(result) {
          that.loadSourcePattern(result.data, patternURL, patternURL,
            function() {
              that.session.updateLocation();
            });
        },
        function(error) {
          console.log('Error loading URL ' + that.session.patternURL + '\n\n' + JSON.stringify(error));
        }
      );
    }
    else {
      that.session.updateLocation();
    }
  }

  constructor(session, $rootScope, $http, $location) {
    var that = this;
    this.name = 'settings';
    this.session = session;
    this.$http = $http;
    this.$location = $location;

    $rootScope.$on('parsedConfig', function() {
      console.log('SettingsController $rootScope.$on parsedConfig');
      console.log('session.sourcePattern', session, session.patternURL);
      that.parsedConfig();
    });

    if (session.initialized) {
      console.log('SettingsController initialized');
      that.parsedConfig();
    }
  }
}

SettingsController.$inject = ['session', '$rootScope', '$http', '$location'];

