import { combineReducers } from 'redux'
import login from './login'
import queue from './queue'

const rootReducer = combineReducers({
  login,
  queue
})

export default rootReducer