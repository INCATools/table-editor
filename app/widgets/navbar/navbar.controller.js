export default class NavbarController {
  constructor(session, $location) {
    this.name = 'navbar';
    this.session = session;
    this.baseURL = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/table-editor/';  //  + $location.path();
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
