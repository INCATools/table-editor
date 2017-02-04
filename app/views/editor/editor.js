import editorComponent from './editor.component';

export default app => {
  app.config(['$stateProvider', '$urlRouterProvider',
    ($stateProvider, $urlRouterProvider) => {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('editor', {
        url: '/',
        template: '<editor></editor>' // Essentially Treats the Editor Directive as the Route View.
      });
  }]);

  app.component('editor', editorComponent);

  if (ENVIRONMENT === 'test') {
    require('./editor.test.js');
  }
};
