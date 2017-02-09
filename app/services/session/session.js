import SessionService from './session.service';

export default app => {
  app.service('session', SessionService);

  if (ENVIRONMENT === 'test') {
    require('./session.test.js');
  }
};
