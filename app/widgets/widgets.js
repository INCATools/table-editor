import navbarComponent from './navbar/navbar';
import helpComponent from './help/help';

export default app => {
  INCLUDE_ALL_MODULES([navbarComponent, helpComponent], app);
};
