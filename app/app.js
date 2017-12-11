import angular from 'angular';
import angularUIRouter from '@uirouter/angularjs';

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
      // element.triggerHandler('input');
      element[0].focus(function() {
        // console.log('focus');
        // ctrl.$setViewValue('');
        // element[0].triggerHandler('input');
        element[0].trigger('input');
      });
      element.bind('blur', function () {
        // console.log('blur');
        // scope.$broadcast('uiGridEventCancelCellEdit');
      });
     }
  };
});



/*

app.directive('showListNew', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attr, ctrl) {
      element.bind('focus', function() {
        console.log('xfocus');
        // ctrl.$setViewValue('');
        element.triggerHandler('input');
      });
      element.bind('blur', function () {
        console.log('xblur');
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
        console.log('yclick');
        ctrl.$setViewValue(' ');
      });
      element.bind('blur', function () {
        console.log('yblur');
        ctrl.$setViewValue('');
      });
    }
  };
});


app.directive('typeaheadFocus', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attr, ngModel) {

      // trigger the popup on 'click' because 'focus'
      // is also triggered after the item selection
      element.bind('click', function () {

        var viewValue = ngModel.$viewValue;

        // restore to null value so that the typeahead can detect a change
        if (ngModel.$viewValue === '') {
          ngModel.$setViewValue(null);
        }

        // force trigger the popup
        ngModel.$setViewValue('');

        // set the actual value in case there was already a value in the input
        ngModel.$setViewValue(viewValue || '');
      });
    }
  };
});

app.config([ '$provide', function($provide) {
  $provide.decorator('uiGridEditService', [
    '$delegate',
    function myServiceDecorator($delegate) {
      console.log('myServiceDecorator', $delegate);

      var isStartEditKey = $delegate.isStartEditKey;

      function isStartEditKeyOverride() {
        console.log('isStartEditKeyOverride', arguments);
        // new service function
        isStartEditKey.apply($delegate, arguments);
      }

      $delegate.isStartEditKey = isStartEditKeyOverride;
      return $delegate;
    }
  ]);
}]);
*/

/*
app.decorator('uiGridEditService', [
    '$delegate',
    function myServiceDecorator($delegate) {
      console.log('myServiceDecorator', $delegate);

      var initializeGrid = $delegate.initializeGrid;
      var isStartEditKey = $delegate.isStartEditKey;

      function isStartEditKeyOverride() {
        console.log('isStartEditKeyOverride', arguments);
        // new service function
        return isStartEditKey.apply($delegate, arguments);
      }

      function initializeGridOverride() {
        console.log('initializeGridOverride', arguments);
        // new service function
        initializeGrid.apply($delegate, arguments);
      }

      $delegate.initializeGrid = initializeGridOverride;
      $delegate.isStartEditKey = isStartEditKeyOverride;
      return $delegate;
    }
  ]);


app.decorator('uiGridCellNavService', [
    '$delegate',
    function myServiceDecorator($delegate) {
      console.log('myServiceDecorator', $delegate);

      var getDirection = $delegate.getDirection;

      function getDirectionOverride(evt) {
        console.log('getDirection', evt);
        return null;  // getDirection.apply($delegate, [evt]);
      }

      $delegate.getDirection = getDirectionOverride;
      return $delegate;
    }
  ]);
*/




///**
//   *  @ngdoc directive
//   *  @name ui.grid.edit.directive:uiGridEditor
//   *  @element div
//   *  @restrict A
//   *
//   *  @description input editor directive for editable fields.
//   *  Provides EndEdit and CancelEdit events
//   *
//   *  Events that end editing:
//   *     blur and enter keydown
//   *
//   *  Events that cancel editing:
//   *    - Esc keydown
//   *
//   */
//  app.directive('budGridEditor',
//    ['gridUtil', 'uiGridConstants', 'uiGridEditConstants', '$timeout', 'uiGridEditService',
//      function (gridUtil, uiGridConstants, uiGridEditConstants, $timeout, uiGridEditService) {
//        return {
//          scope: true,
//          require: ['?^uiGrid', '?^uiGridRenderContainer', 'ngModel'],
//          compile: function () {
//            return {
//              pre: function ($scope, $elm, $attrs) {
//
//              },
//              /* eslint brace-style: 0 */
//              /* eslint spaced-comment: 0 */
//              /* eslint comma-spacing: 0 */
//              post: function ($scope, $elm, $attrs, controllers) {
//                var uiGridCtrl, renderContainerCtrl, ngModel;
//                if (controllers[0]) { uiGridCtrl = controllers[0]; }
//                if (controllers[1]) { renderContainerCtrl = controllers[1]; }
//                if (controllers[2]) { ngModel = controllers[2]; }
//
//                //set focus at start of edit
//                $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, function (evt,triggerEvent) {
//                  console.log('begin', triggerEvent);
//                  $timeout(function () {
//                    $elm[0].focus();
//                    //only select text if it is not being replaced below in the cellNav viewPortKeyPress
//                    if ($elm[0].select && ($scope.col.colDef.enableCellEditOnFocus || !(uiGridCtrl && uiGridCtrl.grid.api.cellNav))) {
//                      $elm[0].select();
//                    }
//                    else {
//                      //some browsers (Chrome) stupidly, imo, support the w3 standard that number, email, ...
//                      //fields should not allow setSelectionRange.  We ignore the error for those browsers
//                      //https://www.w3.org/Bugs/Public/show_bug.cgi?id=24796
//                      try {
//                        $elm[0].setSelectionRange($elm[0].value.length, $elm[0].value.length);
//                      }
//                      catch (ex) {
//                        //ignore
//                      }
//                    }
//                  });
//
//                  //set the keystroke that started the edit event
//                  //we must do this because the BeginEdit is done in a different event loop than the intitial
//                  //keydown event
//                  //fire this event for the keypress that is received
//                  if (uiGridCtrl && uiGridCtrl.grid.api.cellNav) {
//                    var viewPortKeyDownUnregister = uiGridCtrl.grid.api.cellNav.on.viewPortKeyPress($scope, function (evt, rowCol) {
//                      if (uiGridEditService.isStartEditKey(evt)) {
//                        ngModel.$setViewValue(String.fromCharCode( typeof evt.which === 'number' ? evt.which : evt.keyCode), evt);
//                        ngModel.$render();
//                      }
//                      viewPortKeyDownUnregister();
//                    });
//                  }
//
//                  // macOS will blur the checkbox when clicked in Safari and Firefox,
//                  // to get around this, we disable the blur handler on mousedown,
//                  // and then focus the checkbox and re-enable the blur handler after $timeout
//                  $elm.on('mousedown', function(evt) {
//                    console.log('mousedown', evt);
//                    if ($elm[0].type === 'checkbox') {
//                      $elm.off('blur', $scope.stopEdit);
//                      $timeout(function() {
//                        $elm[0].focus();
//                        $elm.on('blur', $scope.stopEdit);
//                      });
//                    }
//                  });
//
//                  $elm.on('blur', $scope.stopEdit);
//                });
//
//
//                $scope.deepEdit = false;
//
//                $scope.stopEdit = function (evt) {
//                  console.log('stopEdit');
//                  if ($scope.inputForm && !$scope.inputForm.$valid) {
//                    evt.stopPropagation();
//                    $scope.$emit(uiGridEditConstants.events.CANCEL_CELL_EDIT);
//                  }
//                  else {
//                    $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
//                  }
//                  $scope.deepEdit = false;
//                };
//
//
//                $elm.on('click', function (evt) {
//                  console.log('click', evt);
//                  if ($elm[0].type !== 'checkbox') {
//                    $scope.deepEdit = true;
//                    $timeout(function () {
//                      $scope.grid.disableScrolling = true;
//                    });
//                  }
//                });
//
//                $elm.on('keydown', function (evt) {
//                  console.log('keydown', evt);
//                  switch (evt.keyCode) {
//                    case uiGridConstants.keymap.ESC:
//                      evt.stopPropagation();
//                      $scope.$emit(uiGridEditConstants.events.CANCEL_CELL_EDIT);
//                      break;
//                  }
//
//                  // if ($scope.deepEdit &&
//                  if (
//                    (evt.keyCode === uiGridConstants.keymap.LEFT ||
//                     evt.keyCode === uiGridConstants.keymap.RIGHT ||
//                     evt.keyCode === uiGridConstants.keymap.UP ||
//                     evt.keyCode === uiGridConstants.keymap.DOWN)) {
//                    evt.stopPropagation();
//                  }
//                  // Pass the keydown event off to the cellNav service, if it exists
//                  else if (uiGridCtrl && uiGridCtrl.grid.api.cellNav) {
//                    evt.uiGridTargetRenderContainerId = renderContainerCtrl.containerId;
//                    if (uiGridCtrl.cellNav.handleKeyDown(evt) !== null) {
//                      $scope.stopEdit(evt);
//                    }
//                  }
//                  else {
//                    //handle enter and tab for editing not using cellNav
//                    switch (evt.keyCode) {
//                      case uiGridConstants.keymap.ENTER: // Enter (Leave Field)
//                      case uiGridConstants.keymap.TAB:
//                        evt.stopPropagation();
//                        evt.preventDefault();
//                        $scope.stopEdit(evt);
//                        break;
//                    }
//                  }
//
//                  return true;
//                });
//
//                $scope.$on('$destroy', function unbindEvents() {
//                  // unbind all jquery events in order to avoid memory leaks
//                  $elm.off();
//                });
//              }
//            };
//          }
//        };
//      }]);

