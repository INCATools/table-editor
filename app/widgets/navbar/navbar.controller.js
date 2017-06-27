export default class NavbarController {
  constructor(session, $location) {
    this.name = 'navbar';
    this.session = session;
    this.$location = $location;
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
    this.$location.search('yaml', null);
    this.$location.search('xsv', null);
    this.session.loadConfigurationByName(name);
  }
}

NavbarController.$inject = ['session', '$location'];
