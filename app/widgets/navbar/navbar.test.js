/* eslint-disable */

import NavbarModule from './navbar'
import NavbarController from './navbar.controller';
import NavbarComponent from './navbar.component';
import NavbarTemplate from './navbar.html';

describe('Navbar', () => {
  let $location;
  let $rootScope;
  let makeController;


  beforeEach(window.module('app'));
  beforeEach(inject((_$rootScope_, _$controller_) => {
    $rootScope = _$rootScope_;
    makeController = () => {
      let ctrl = _$controller_(NavbarController,
        {
          $location: {
            protocol: function() { return 'protocol'; },
            host: function() { return 'host'; },
            port: function() { return 'port'; }
          }
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
    it('has navbar-brand in templatehelp', () => {
      expect(NavbarTemplate).to.match(/navbar-brand/g);
    });
  });

  describe('Component', () => {
    // component/directive specs
    let component = NavbarComponent;

    it('includes the intended template',() => {
      expect(component.template).to.equal(NavbarTemplate);
    });

    it('uses `controllerAs` syntax', () => {
      expect(component).to.have.property('controllerAs');
    });

    it('invokes the right controller', () => {
      expect(component.controller).to.equal(NavbarController);
    });
  });
});
