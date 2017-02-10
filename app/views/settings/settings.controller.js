export default class SettingsController {
  constructor(session) {
    this.name = 'settings';
    this.session = session;
  }
}

SettingsController.$inject = ['session'];

