const initialState = {
  dataPublishers: {},
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
    {
      const dataPublishers = {};

      for (const dp of action.data.dataPublisher) {
        dataPublishers[dp.id] = dp;
      }

      return { ...state, dataPublishers };
    }
    case 'UPDATE_DATA_PUBLISHER':
    {
      return {
        ...state,
        dataPublishers: {
          ...state.dataPublishers, [action.data.id]: action.data
        }
      };
    }
    case 'NEW_DATA_PUBLISHER_DATA':
    {
      const id = action.data.id;
      return {
        ...state,
        dataPublishers: {
          ...state.dataPublishers, [id]:
          { ...state.dataPublishers[id], values: action.data.data }
        }
      };
    }
    default:
      return state;
  }
};
