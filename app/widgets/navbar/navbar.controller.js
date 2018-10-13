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

  exportGitHub() {
    this.session.exportGitHub();
  }

  setConfiguration(name) {
    // console.log('###setConfiguration', name);
    this.$location.search({});
    this.session.loadConfigurationByName(name);
  }
}

NavbarController.$inject = ['session', '$location'];
