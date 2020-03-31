const initialState = {
  dataPublishers: {},
  publishing: false,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
    {
      const dataPublishers = {};

      for (const dp of action.data.dataPublisher) {
        dataPublishers[dp.id] = { ...dp, loaded: true };
      }

      return { ...state, dataPublishers };
    }
    case 'UPDATE_DATA_PUBLISHER':
    {
      const publishing_list = Object.values(state.dataPublishers).map(dp => dp.running);
      publishing_list.push(action.data.running);

      return {
        ...state,
        dataPublishers: {
          ...state.dataPublishers, [action.data.id]: { ...action.data, loaded: true }
        },
        publishing: publishing_list.includes(true)
      };
    }
    case 'NEW_DATA_PUBLISHER_DATA':
    {
      const id = action.data.id;
      const data = state.dataPublishers[action.data.id].values;

      data.x = [...data.x, action.data.data.x];
      data.y = [...data.y, action.data.data.y];

      if (state.dataPublishers.data_dim > 1) {
        data.z = [...data.z, action.data.z];
      }

      return {
        ...state,
        dataPublishers: {
          ...state.dataPublishers, [id]:
          { ...state.dataPublishers[id], values: data }
        }
      };
    }
    default:
      return state;
  }
};

export function getSource(state, id) {
  const _p = state.dataPublisher.dataPublishers[id];

  let publisher = {
    loaded: false
  };

  if (_p !== undefined) {
    publisher = _p;
  }

  return publisher;
}
