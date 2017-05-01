export default class NavbarController {
  constructor(session, $location) {
    this.name = 'navbar';
    this.session = session;
    this.baseURL = $location.protocol() + '://' + $location.host() + ':' + $location.port();  //  + $location.path();
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
}

NavbarController.$inject = ['session', '$location'];
