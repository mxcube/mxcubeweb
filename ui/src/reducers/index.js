import { reducer as formReducer } from 'redux-form';

import beamline from './beamline';
import contextMenu from './contextMenu';
import general from './general';
import harvester from './harvester';
import harvesterMaintenance from './harvesterMaintenance';
import logger from './logger';
import login from './login';
import queue from './queue';
import queueGUI from './queueGUI';
import remoteAccess from './remoteAccess';
import sampleChanger from './sampleChanger';
import sampleChangerMaintenance from './sampleChangerMaintenance';
import sampleGrid from './sampleGrid';
import sampleview from './sampleview';
import shapes from './shapes';
import taskForm from './taskForm';
import taskResult from './taskResult';
import uiproperties from './uiproperties';
import waitDialog from './waitDialog';
import workflow from './workflow';

const rootReducer = {
  login,
  queue,
  uiproperties,
  sampleGrid,
  sampleChanger,
  sampleChangerMaintenance,
  harvester,
  harvesterMaintenance,
  taskForm,
  sampleview,
  logger,
  general,
  beamline,
  remoteAccess,
  contextMenu,
  shapes,
  queueGUI,
  workflow,
  taskResult,
  form: formReducer,
  waitDialog,
};

export default rootReducer;
