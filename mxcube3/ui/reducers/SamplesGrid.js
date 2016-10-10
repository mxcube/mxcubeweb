/**
*  Initial redux state for SampleGrid,
*
*  selected:   Object (key, selected), selected indicating if sample with key
*              currently is selected
*
*  order:      Map (key, order) for each sample. The order map is kept sorted
*              (ascending)
*
*  picked:     Object (key, picked), picked indicating if sample with key
*              currently is picked
*
*  moving:     Object (key, moving), moving indicating if sample with key is
*              currently beeing moved
*
*  filterText: Current filter text
*/
const INITIAL_STATE = { selected: {},
                        order: {},
                        moving: {},
                        contextMenu: {},
                        filterText: '' };

/**
 * Calculates the inital grid display order from a set of samples
 *
 * @param {Object} sampleList - key, value (sample id, sample data object)
 * @returns {Object} - key, value (sample id, order number (int))
 *
 */
function initialGridOrder(sampleList) {
  const gridOrder = {};

  for (const key in sampleList) {
    if (key) {
      const order = Object.keys(gridOrder).length;
      gridOrder[key] = order;
    }
  }

  return gridOrder;
}


/**
 * Gets the sampleOrder for the next sample to be appended to the sample grid
 *
 * @param {Object} order - Grid display order object containing (key, order) pairs
 * @returns {int} - next order number
 *
 */
function sampleOrder(order) {
  let m = Math.max.apply(null, Object.values(order));

  if (m === -Infinity) {
    m = 0;
  } else {
    m++;
  }

  return m;
}


export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    // Sets the list of samples (sampleList), clearing any existing list
    // Sets only the initial display order of samples in grid for this reducer
    case 'SET_SAMPLE_LIST': {
      return Object.assign({}, state, { order: initialGridOrder(action.sampleList) });
    }
    // Append one sample to the list of samples (sampleList),
    case 'APPEND_TO_SAMPLE_LIST': {
      const order = { ...state.order, [action.sampleData.sampleID]: sampleOrder(state.order) };

      return Object.assign({}, state, { order });
    }
    // Set display order of samples in grid
    case 'SET_SAMPLE_ORDER': {
      return Object.assign({}, state, { order: action.order });
    }
    // Toggles a samples movable flag
    case 'TOGGLE_MOVABLE_SAMPLE': {
      const moving = {};
      moving[action.key] = (!state.moving[action.key]);
      return Object.assign({}, state, { moving });
    }
    // Select a range of samples
    case 'SELECT_SAMPLES': {
      const selectedItems = {};
      const movingItems = {};

      for (const key of action.indices) {
        selectedItems[key] = true;
        movingItems[action.key] = (state.moving[action.key] && state.selected[action.key]);
      }

      return Object.assign({}, state, { selected: selectedItems, moving: movingItems });
    }
    case 'TOGGLE_SELECTED_SAMPLE': {
      const selected = Object.assign({}, state.selected);
      selected[action.sampleID] = (!state.selected[action.sampleID]);
      return Object.assign({}, state, { selected });
    }
    case 'SAMPLE_GRID_CONTEXT_MENU': {
      return Object.assign({}, state, { contextMenu: { x: action.x,
                                                       y: action.y,
                                                       show: action.show } });
    }
    case 'FILTER_SAMPLE_LIST': {
      return Object.assign({}, state, { filterText: action.filterText });
    }
    case 'QUEUE_STATE': {
      return state; // action.sampleGridState;
    }
    case 'CLEAR_ALL': {
      return { ...INITIAL_STATE };
    }
    case 'SET_INITIAL_STATUS': {
      return { ...state };
    }
    default: {
      return state;
    }
  }
};
