import { omit } from 'lodash/object';


/**
*  Initial redux state for SampleGrid,
*  
*  sampleList:  Object consisting of sample objects, each sample object have
*               the following peroperties:
* 
*               code        Data Matrix/Barcode of sample
*               id          Unique id for the sample
*               location    Location of sample in sample changer
*               queueOrder  Order of sample in queue
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
*  manulMount: Sample with id is manually mounted if set is true
*
*  filterText: Current filter text
*/
const INITIAL_STATE = { sampleList: {},
                        selected: {},
                        order: new Map(),
                        picked: {},
                        moving: {},
                        manualMount: { set: false, id: 0 },
                        filterText: '' };


function initialSampleOrder(sampleList) {
  const gridOrder = new Map();

  for (const key in sampleList) {
    if (key) {
      const order = gridOrder.size;
      gridOrder.set(key, order);
      sampleList[key]['queueOrder'] = -1;
    }
  }

  return gridOrder;
}


function togglePicked(keys, state){
  const picked = Object.assign({}, state.picked);

  // Toggle pick state for each key
  for (let key of keys) {
    picked[key] = !picked[key];
  }

  return picked;
}


function recalculateQueueOrder(keys, gridOrder, state) {
  const sampleList = Object.assign({}, state.sampleList);

  // recalculate the order of the sample in the queue the grid sample order, 
  // state.order, is always sorted ! 
  let i = 0;
  for (let key of gridOrder.keys()) {
    if (keys.includes(key)) {
      sampleList[key]['queueOrder'] = i;
      i++;
    }
  }

  return sampleList;
}


export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SIGNOUT': {
      return Object.assign({}, INITIAL_STATE);
    }
    case 'UPDATE_SAMPLE_LIST': {
      return Object.assign({}, state, { sampleList: action.sampleList,
                                        order: initialSampleOrder(action.sampleList) });
    }
    case 'ADD_SAMPLE_TO_GRID': {
      return { ...state, sampleList: { ...state.sampleList, [action.id]: action.data },
                         manualMount: { ...state.manualMount, id: state.manualMount.id + 1 } };
    }
    case 'SET_SAMPLE_ORDER': {
      const order = new Map([...action.order.entries()].sort((a, b) => a[1] > b[1]));

      let reorderKeys = Object.keys(state.picked).map(key => state.picked[key] ? key : '');
      let sampleList = recalculateQueueOrder(reorderKeys, order, state);

      return Object.assign({}, state, { order, sampleList});
    }
    case 'TOGGLE_MOVABLE_SAMPLE': {
      const movingItems = {};
      movingItems[action.key] = (!state.moving[action.key]);
      return Object.assign({}, state, { moving: movingItems });
    }
    case 'SELECT_SAMPLES': {
      const selectedItems = {};
      const movingItems = {};

      for (const key of action.indices) {
        selectedItems[key] = true;
        movingItems[action.key] = (state.moving[action.key] && state.selected[action.key]);
      }

      return Object.assign({}, state, { selected: selectedItems, moving: movingItems });
    }
    case 'PICK_SELECTED_SAMPLES': {
      let keys = [];

      // Get keys of selected sample items
      for (const key in state.selected) {
        if (state.selected[key]) {
          keys.push(key);
        }
      }

      let picked = togglePicked(keys, state);
      
      // Filter out only the picked keys
      let reorderKeys = Object.keys(picked).map(key => picked[key] ? key : '');
      let sampleList = recalculateQueueOrder(reorderKeys, state.order, state);

      return Object.assign({}, state, { picked, sampleList });
    }
    case 'PICK_ALL_SAMPLES': {
      let picked = {}
      Object.keys(state.sampleList).map(key => picked[key] = action.picked);

      // Filter out only the picked keys
      let reorderKeys = Object.keys(picked).map(key => picked[key] ? key : '');
      let sampleList = recalculateQueueOrder(reorderKeys, state.order, state);

      return Object.assign({}, state, { picked, sampleList });
    }
    case 'FILTER_SAMPLE_LIST': {
      return Object.assign({}, state, { filterText: action.filterText });
    }
    case 'SET_SAMPLES_INFO': {
      const samplesList = {};

      Object.keys(state.samplesList).forEach(key => {
        const sample = state.samplesList[key];
        let sampleInfo;
        for (sampleInfo of action.sampleInfoList) {
          if (sampleInfo.code) {
            // find sample with data matrix code
            if (sample.code === sampleInfo.code) {
              samplesList[key] = Object.assign({}, sample, { sample_info: sampleInfo });
              break;
            }
          } else {
            // check with sample changer location
            const containerLocation = sampleInfo.containerSampleChangerLocation;
            const sampleLocation = sampleInfo.sampleLocation;
            const limsLocation = `${containerLocation} : ${sampleLocation}`;

            if (sample.location === limsLocation) {
              samplesList[key] = Object.assign({}, sample, { sample_info: sampleInfo });
              break;
            }
          }
        }
        if (samplesList[key] === undefined) {
          samplesList[key] = Object.assign({}, sample, { sample_info: null });
        }
      });
      return Object.assign({}, state, { sampleList: samplesList });
    }
    case 'SET_MANUAL_MOUNT': {
      const data = { manualMount: { ...state.manualMount, set: action.manual } };
      return Object.assign({}, state, data);
    }
    case 'ADD_TASK': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: { ...state.sampleList[action.index].tasks, [action.queueID]:
                {
                  type: action.taskType,
                  label: action.taskType.split(/(?=[A-Z])/).join(' '),
                  sampleID: action.index,
                  queueID: action.queueID,
                  parentID: action.parentID,
                  parameters: action.parameters,
                  state: 0
                }
                }
              }
             } });
    }
    case 'UPDATE_TASK': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: { ...state.sampleList[action.index].tasks, [action.queueID]:
                {
                  ...state.sampleList[action.index].tasks[action.queueID],
                  type: action.parameters.Type,
                  queueID: action.queueID,
                  parameters: action.parameters
                } }
              }
             } }
          );
    }
    case 'REMOVE_TASK': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: omit(state.sampleList[action.index].tasks, [action.queueID])
              }
             } }
          );
    }
    case 'REMOVE_SAMPLE': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.sampleID]: { ...state.sampleList[action.sampleID],
                tasks: {}
              }
             } }
          );
    }
    case 'ADD_TASK_RESULT': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: { ...state.sampleList[action.index].tasks, [action.queueID]:
                {
                  ...state.sampleList[action.index].tasks[action.queueID],
                  state: action.state
                } }
              }
             } }
          );
    }
    case 'QUEUE_STATE': {
      return state; // action.sampleGridState;
    }
    case 'SET_INITIAL_STATUS': {
      return { ...state, manualMount: { set: !action.data.useSC, id: 0 } };
    }
    default: {
      return state;
    }
  }
};