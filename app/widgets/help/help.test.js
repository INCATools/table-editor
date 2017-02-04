/* eslint-disable */

import HelpModule from './help';
import HelpController from './help.controller';
import HelpComponent from './help.component';
import HelpTemplate from './help.html';

describe('Help', () => {
  let $rootScope, makeController;

  beforeEach(window.module('app'));
  beforeEach(inject((_$rootScope_) => {
    $rootScope = _$rootScope_;
    makeController = () => {
      return new HelpController();
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
    it('has GitHub Source in template', () => {
      expect(HelpTemplate).to.match(/GitHub Source/g);
    });
  });

  describe('Component', () => {
    // component/directive specs
    let component = HelpComponent;

    it('includes the intended template',() => {
      expect(component.template).to.equal(HelpTemplate);
    });

    it('uses `controllerAs` syntax', () => {
      expect(component).to.have.property('controllerAs');
    });

    it('invokes the right controller', () => {
      expect(component.controller).to.equal(HelpController);
    });
  });
});
