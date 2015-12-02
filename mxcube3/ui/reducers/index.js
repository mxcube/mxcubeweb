import { combineReducers } from 'redux'
import login from './login'
import queue from './queue'
import samples_grid from './samples_grid'


const rootReducer = combineReducers({
  login,
  queue,
  samples_grid
})

export default rootReducer

