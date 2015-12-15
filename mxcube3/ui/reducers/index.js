import { combineReducers } from 'redux'
import login from './login'
import queue from './queue'
import samples_grid from './samples_grid'
import {reducer as formReducer} from 'redux-form';


const rootReducer = combineReducers({
  login,
  queue,
  samples_grid,
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

