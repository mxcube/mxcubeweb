import { INITIAL_STATE, SET_ATTRIBUTE, SET_ALL_ATTRIBUTES,
  SET_BUSY_STATE } from '../actions/beamline_atypes';


export default (state = INITIAL_STATE, action) => {
  let data = {};

  switch (action.type) {
    case SET_ALL_ATTRIBUTES:
      return Object.assign({}, state, action.data);

    case SET_ATTRIBUTE:
      data[action.data.name] = { name: action.data.name,
                                  value: action.data.value,
                                  state: action.data.state,
                                  msg: action.data.msg };

      return Object.assign({}, state, data);

    case SET_BUSY_STATE:
      data = Object.assign({}, state);
      data[action.data.name].state = action.data.state;

      return data;

    default:
      return state;
  }
};
