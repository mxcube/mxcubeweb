import { combineReducers } from 'redux'
import login from './login'
import samples_grid from './samples_grid'
import queue from './queue'

export default combineReducers({
    login,
    samples_grid,
    queue
})

