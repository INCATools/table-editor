import helpComponent from './help.component';

export default app => {
  app.component('help', helpComponent);

  if (ENVIRONMENT === 'test') {
    require('./help.test.js');
  }
};


