import sessionService from './session/session';

export default app => {
  INCLUDE_ALL_MODULES([sessionService], app);
}
