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
}

NavbarController.$inject = ['session'];
