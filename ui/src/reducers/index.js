import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import login from './login';
import queue from './queue';
import queueGUI from './queueGUI';
import sampleGrid from './sampleGrid';
import sampleChanger from './sampleChanger';
import sampleChangerMaintenance from './sampleChangerMaintenance';
import harvester from './harvester';
import harvesterMaintenance from './harvesterMaintenance';
import taskForm from './taskForm';
import sampleview from './sampleview';
import general from './general';
import beamline from './beamline';
import logger from './logger';
import contextMenu from './contextMenu';
import remoteAccess from './remoteAccess';
import shapes from './shapes';
import workflow from './workflow';
import taskResult from './taskResult';
import uiproperties from './uiproperties';
import waitDialog from './waitDialog';

const mxcubeReducer = combineReducers({
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
});

const rootReducer = (state, action) => {
  return mxcubeReducer(state, action);
};

export default rootReducer;
