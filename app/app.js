// Angular & Router ES6 Imports
import angular from 'angular';
import angularUIRouter from 'angular-ui-router';

import ngsanitize from 'angular-sanitize';
import nguibootstrap from 'angular-ui-bootstrap';
import ngResource from 'angular-resource';
import ngFileUpload from 'ng-file-upload';
import jsonformatter from 'jsonformatter';
import jsonformatterCSS from 'jsonformatter/dist/json-formatter.min.css';

import ngGrid from './ui-grid-patched.min.js';
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
                        'ui.grid.autoResize', 'ui.grid.resizeColumns'];

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
