/* eslint-disable */

import EditorModule from './editor';
import EditorController from './editor.controller';
import EditorComponent from './editor.component';
import EditorTemplate from './editor.html';

describe('Editor', () => {
  let $rootScope, $controller, scope, makeController;

  beforeEach(window.module('app'));
  beforeEach(inject((_$rootScope_, $timeout, $log, $http, $httpBackend, _$controller_) => {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    makeController = () => {
      let ctrl = _$controller_(EditorController,
        { $scope: scope
        });

      return ctrl;
    };
  }));

  describe('Module', () => {
    // top-level specs: i.e., routes, injection, naming
  });

  describe('Controller', () => {
    // controller specs
    it('has a name propertyhelp', () => { // erase if removing this.name from the controller
      let controller = makeController();
      expect(controller).to.have.property('name');
    });
  });

  describe('Template', () => {
    // template specs
    // tip: use regex to ensure correct bindings are used e.g., {{  }}
    it('has YAML Examples in template', () => {
      expect(EditorTemplate).to.match(/Pattern Examples/g);
    });
  });

  describe('Component', () => {
    // component/directive specs
    let component = EditorComponent;

    it('includes the intended template',() => {
      expect(component.template).to.equal(EditorTemplate);
    });

    it('uses `controllerAs` syntax', () => {
      expect(component).to.have.property('controllerAs');
    });

    it('invokes the right controller', () => {
      expect(component.controller).to.equal(EditorController);
    });
  });
});
