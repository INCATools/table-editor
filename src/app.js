import ng from 'angular';
import ngsanitize from 'angular-sanitize';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import nguibootstrap from 'angular-ui-bootstrap';
import ngResource from 'angular-resource';
import ngFileUpload from 'ng-file-upload';
import MainController from './MainController.js';
import jsonformatter from 'jsonformatter';
import jsonformatterCSS from 'jsonformatter/dist/json-formatter.min.css';

//
// Angular 1.6 and ui-grid don't play well, so I have a patched version until ui-grid gets fixed,
// which should be soon.
// PR here: https://github.com/angular-ui/ui-grid/pull/5949
// Using this patch: https://github.com/dominusbelial/ui-grid-5890-fix
//
// import ngGrid from 'angular-ui-grid';
import ngGrid from './ui-grid-patched.min.js';
import '../node_modules/angular-ui-grid/ui-grid.min.css';

require('./style.css');

var dependentModules = [nguibootstrap, ngsanitize, ngResource, ngFileUpload, jsonformatter,
                        'ui.grid', 'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.cellNav',
                        'ui.grid.autoResize', 'ui.grid.resizeColumns',
                        MainController];
var app = ng.module('app', dependentModules);

app.config(['$httpProvider', function config($httpProvider) {
  $httpProvider.defaults.withCredentials = true;
  $httpProvider.defaults.useXDomain = true;
}]);

app.config( ['$provide', function ($provide) {
    $provide.decorator('$browser', ['$delegate', function ($delegate) {
        $delegate.onUrlChange = function(newUrl, newState) {
        };
        $delegate.url = function (url) {
                                      return '';
                                    };
        return $delegate;
    }]);
}]);

//
// For some reason, $location isn't working properly in changing the URL bar, so
// I disabled it. I think that $location must be used in conjunction with the
// angular router, which I am not currently using.
// $location works, but when it rewrites the URL it unnecessarily URIencodes it, which is undesirable.
//
// app.config(['$locationProvider', function config($locationProvider) {
  // $locationProvider.html5Mode({
  //   enabled: true,
  //   requireBase: true
  // });
// }]);

app.config(['JSONFormatterConfigProvider', function (JSONFormatterConfigProvider) {
    JSONFormatterConfigProvider.hoverPreviewEnabled = true;
  }]);
