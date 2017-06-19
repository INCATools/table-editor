export default class NavbarController {
  constructor(session, $location) {
    this.name = 'navbar';
    this.session = session;
    this.baseURL = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/table-editor/';  //  + $location.path();
    this.logoImage = 'INCA.png';

    if (window.configTE) {
      if (window.configTE.baseURL) {
        this.baseURL = window.configTE.baseURL;
      }
      if (window.configTE.logoImage) {
        this.logoImage = window.configTE.logoImage;
      }
    }
  }

  exportCSV() {
    this.session.exportXSV('csv');
  }

  exportTSV() {
    this.session.exportXSV('tsv');
  }

  exportTAB() {
    this.session.exportXSV('tab');
  }

  setConfiguration(name) {
    this.session.loadConfigurationByName(name);
  }
}

NavbarController.$inject = ['session', '$location'];
