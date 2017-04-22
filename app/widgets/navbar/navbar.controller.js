export default class NavbarController {
  constructor(session) {
    this.name = 'navbar';
    this.session = session;
  }

  exportCSV() {
    console.log('exportCSV');
    this.session.exportXSV('csv');
  }

  exportTSV() {
    this.session.exportXSV('tsv');
  }

  exportTAB() {
    this.session.exportXSV('tab');
  }
}

NavbarController.$inject = ['session'];
