/* eslint-disable */

import SettingsModule from './settings'
import SettingsController from './settings.controller';
import SettingsComponent from './settings.component';
import SettingsTemplate from './settings.html';

describe('Settings', () => {
  let $rootScope, makeController;

  beforeEach(window.module('app'));
  beforeEach(inject((_$rootScope_) => {
    $rootScope = _$rootScope_;
    makeController = () => {
      return new SettingsController();
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
    it('has class="settings" in template', () => {
      expect(SettingsTemplate).to.match(/class="settings"/g);
    });
  });

  describe('Component', () => {
    // component/directive specs
    let component = SettingsComponent;

    it('includes the intended template',() => {
      expect(component.template).to.equal(SettingsTemplate);
    });

    it('uses `controllerAs` syntax', () => {
      expect(component).to.have.property('controllerAs');
    });

    it('invokes the right controller', () => {
      expect(component.controller).to.equal(SettingsController);
    });
  });
});
