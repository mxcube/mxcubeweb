import { combineReducers } from 'redux'
import login from './login'
import samples_grid from './samples_grid'
import sample_grid_item from './sample_grid_item'

export default combineReducers({
    login,
    samples_grid
})

