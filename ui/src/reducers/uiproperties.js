import { clone, findIndex, setWith } from 'lodash';

const INITIAL_STATE = {};

function uiPropertiesReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_UI_PROPERTIES': {
      return { ...state, ...action.data };
    }
    /* `uiproperties` is a server state so it should ideally not be modified locally.
     * We make an exception here until motor steps can be updated on the server. */
    case 'SET_MOTOR_STEP': {
      const idx = findIndex(
        state.sample_view_motors.components,
        (o) => o.role === action.role,
      );

      return setWith(
        clone(state),
        `sample_view_motors.components[${idx}].step`,
        action.value,
        clone,
      );
    }
    case 'SET_INITIAL_STATE': {
      return { ...state, ...action.data.uiproperties };
    }
    default: {
      return state;
    }
  }
}

export default uiPropertiesReducer;
