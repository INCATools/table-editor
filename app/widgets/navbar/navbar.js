import navbarComponent from './navbar.component';

export default app => {
  app.component('navbar', navbarComponent);

  if (ENVIRONMENT === 'test') {
    require('./navbar.test.js');
  }
};

