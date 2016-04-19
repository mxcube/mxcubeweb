import { combineReducers } from 'redux';
import login from './login';
import queue from './queue';
import samples_grid from './samples_grid';
import taskForm from './taskForm';
import sampleview from './sampleview';
import general from './general';
import beamline from './beamline';
import {reducer as formReducer} from 'redux-form';


const rootReducer = combineReducers({
  login,
  queue,
  samples_grid,
  taskForm,
  sampleview,
  logger,
  general,
  beamline,
  form: formReducer.plugin({
    characterisation: (state, action) => { // <------ 'characterisation' is name of form given to reduxForm()
      switch(action.type) {
        case "ADD_METHOD":
          return undefined;       // <--- blow away form data
        default:
          return state;
      }
    }
    })
})

export default rootReducer

