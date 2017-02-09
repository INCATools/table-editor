import settingsComponent from './settings.component';

export default app => {
  app.config(['$stateProvider', '$urlRouterProvider',
    ($stateProvider, $urlRouterProvider) => {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('settings', {
        url: '/settings',
        template: '<settings></settings>' // Essentially Treats the Settings Directive as the Route View.
      });
  }]);

  app.component('settings', settingsComponent);

  if (ENVIRONMENT === 'test') {
    require('./settings.test.js');
  }
};
