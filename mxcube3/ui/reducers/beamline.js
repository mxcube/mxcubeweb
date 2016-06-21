import { INITIAL_STATE, 
         BL_ATTR_SET, 
         BL_ATTR_GET_ALL,
         BL_ATTR_SET_STATE } from '../actions/beamline';


export default (state = INITIAL_STATE, action) => {
  let data = {};

  switch (action.type) {
    case BL_ATTR_GET_ALL:
      return Object.assign({}, state, action.data);

    case BL_ATTR_SET:
      data[action.data.name] = { name: action.data.name,
                                 value: action.data.value,
                                 state: action.data.state,
                                 msg: action.data.msg };

      return Object.assign({}, state, data);

    case BL_ATTR_SET_STATE:
      data = Object.assign({}, state);
      data[action.data.name].state = action.data.state;

      return data;

    default:
      return state;
  }
};
