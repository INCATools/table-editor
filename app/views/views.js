import settingsComponent from './settings/settings';
import editorComponent from './editor/editor';

export default app => {
  INCLUDE_ALL_MODULES([settingsComponent, editorComponent], app);
};

