import { combineReducers } from 'redux';
import login from './login';
import queue from './queue';
import sampleGrid from './SamplesGrid';
import taskForm from './taskForm';
import sampleview from './sampleview';
import general from './general';
import beamline from './beamline';
import logger from './logger';
import { reducer as formReducer } from 'redux-form';


const rootReducer = combineReducers({
  login,
  queue,
  sampleGrid,
  taskForm,
  sampleview,
  logger,
  general,
  beamline,
  form: formReducer
});

export default rootReducer;

