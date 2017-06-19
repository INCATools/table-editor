// /* global __webpack_public_path__ */
// /* global __webpack_require__ */
// console.log('xxxold __webpack_public_path__', __webpack_public_path__);
//
//
// if (window.configTE && window.configTE.bundleURL) {
//   /* eslint no-global-assign: 0 */
//   /* eslint no-native-reassign: 0 */
//   /* eslint camelcase: 0 */
//   __webpack_public_path__ = window.configTE.bundleURL;
//   console.log('new __webpack_public_path__', __webpack_public_path__);
//   __webpack_require__.p = __webpack_public_path__;
//   console.log('new __webpack_require__.p', __webpack_require__.p);
// }

// Angular & Router ES6 Imports
import angular from 'angular';
import angularUIRouter from 'angular-ui-router';

import ngsanitize from 'angular-sanitize';
import nguibootstrap from 'angular-ui-bootstrap';
import ngResource from 'angular-resource';
import ngFileUpload from 'ng-file-upload';
import jsonformatter from 'jsonformatter';
import jsonformatterCSS from 'jsonformatter/dist/json-formatter.min.css';
import 'angular-fontawesome';
import 'font-awesome/css/font-awesome.min.css';

import ngGrid from 'angular-ui-grid/ui-grid.min.js';
// import ngGrid from './ui-grid-patched.min.js';
import '../node_modules/angular-ui-grid/ui-grid.min.css';
require('./style.css');

import views from './views/views.js';
import widgets from './widgets/widgets.js';
import services from './services/services.js';
import appConfiguration from './app.config';

// Single Style Entry Point
import './index.scss';

/* global ENVIRONMENT */
if (ENVIRONMENT === 'test') {
  console.log('ENV:', ENVIRONMENT);
  require('angular-mocks/angular-mocks');
}

var dependentModules = [angularUIRouter, nguibootstrap, ngsanitize, ngResource, ngFileUpload, jsonformatter,
                        'ui.grid', 'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.cellNav',
                        'ui.grid.autoResize', 'ui.grid.resizeColumns',
                        'picardy.fontawesome'];

const app = angular.module('app', dependentModules);

// Components Entrypoint
views(app);

// Common Components Entrypoint
widgets(app);

// App Services Entrypoint
services(app);

// Router Configuration
// Components must be declared first since
// Routes reference controllers that will be bound to route templates.
appConfiguration(app);

app.directive('showList', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attr, ctrl) {
      element[0].focus(function() {
        // ctrl.$setViewValue('');
        element[0].trigger('input');
      });
      element.bind('blur', function () {
        // ctrl.$setViewValue('');
      });
     }
  };
});

app.directive('typeahead', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attr, ctrl) {
      element.bind('click', function () {
          ctrl.$setViewValue(' ' );
      });
      element.bind('blur', function () {
          ctrl.$setViewValue('');
      });
    }
  };
});
