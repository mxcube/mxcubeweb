/**
*  Initial redux state for SampleGrid,
*
*  selected:   Object (key, selected), selected indicating if sample with key
*              currently is selected
*
*  order:      Map (key, order) for each sample. The order map is kept sorted
*              (ascending)
*
*  moving:     Object (key, moving), moving indicating if sample with key is
*              currently beeing moved
*
*  filterText: Current filter text
*/
import update from 'react/lib/update';
import { SAMPLE_MOUNTED, SAMPLE_UNCOLLECTED } from '../constants';

const INITIAL_STATE = { selected: {},
                        sampleList: {},
                        order: [],
                        moving: {},
                        contextMenu: {},
                        filterText: '' };


export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    // Set the list of samples (sampleList), clearing any existing list
    case 'UPDATE_SAMPLE_LIST': {
      const sampleList = { ...state.sampleList };
      const order = [...state.order];

      for (const sampleID of action.order) {
        const sampleData = action.sampleList[sampleID];
        if (! sampleList[sampleID]) {
          // new sample
          order.push(sampleID);
        }
        sampleList[sampleID] = sampleData;
      }

      return Object.assign({}, state, { sampleList,
					order,
					selected: {} });
    }
    case 'ADD_SAMPLES_TO_LIST': {
      const sampleList = { ...state.sampleList };
      const order = [...state.order];

      for (const sampleData of action.samplesData) {
        const sampleID = sampleData.sampleID;
        sampleList[sampleID] = Object.assign({}, sampleData);
        order.push(sampleID);
      }

      return Object.assign({}, state, { sampleList, order });
    }
    case 'SET_SAMPLE_ORDER': {
      return Object.assign({}, state, { order: action.order });
    }
    case 'SET_SAMPLES_INFO': {
      const sampleList = {};
      Object.keys(state.sampleList).forEach(key => {
        const sample = state.sampleList[key];
        let sampleInfo;
        for (sampleInfo of action.sampleInfoList) {
          if (sampleInfo.code) {
            // find sample with data matrix code
            if (sample.code === sampleInfo.code) {
              sampleList[key] = Object.assign({}, sample, { ...sampleInfo });
              break;
            }
          } else {
            // check with sample changer location
            const containerLocation = sampleInfo.containerSampleChangerLocation;
            const sampleLocation = sampleInfo.sampleLocation;
            const limsLocation = `${containerLocation}:${sampleLocation}`;

            if (sample.location === limsLocation) {
              sampleList[key] = Object.assign({}, sample, { ...sampleInfo });
              break;
            }
          }
        }
        if (sampleList[key] === undefined) {
          sampleList[key] = Object.assign({}, sample, { });
        }
      });
      return Object.assign({}, state, { sampleList });
    }
    case 'ADD_TASK_RESULT': {
      const sampleList = {
        ...state.sampleList,
        [action.sampleID]: {
          ...state.sampleList[action.sampleID],
          tasks: [
            ...state.sampleList[action.sampleID].tasks.slice(0, action.taskIndex),
            {
              ...state.sampleList[action.sampleID].tasks[action.taskIndex],
              checked: false,
              limsResultData: action.limsResultData,
              state: action.state
            },
            ...state.sampleList[action.sampleID].tasks.slice(action.taskIndex + 1)
          ]
        }
      };

      return Object.assign({}, state, { sampleList });
    }
    case 'ADD_TASKS': {
      const sampleList = { ...state.sampleList };

      action.tasks.forEach((t) => {
        const task = { ...t, state: 0 };

        if (task.parameters.prefix === '') {
          task.parameters.prefix = sampleList[task.sampleID].defaultPrefix;
        }

        sampleList[task.sampleID] = {
          ...sampleList[task.sampleID],
          tasks: [...sampleList[task.sampleID].tasks, task],
          state: SAMPLE_UNCOLLECTED
        };
      });

      return Object.assign({}, state, { sampleList });
    }
    case 'REMOVE_TASK': {
      const sampleList = {
        ...state.sampleList,
        [action.sampleID]: {
          ...state.sampleList[action.sampleID],
          tasks: [...state.sampleList[action.sampleID].tasks.slice(0, action.taskIndex),
                  ...state.sampleList[action.sampleID].tasks.slice(action.taskIndex + 1)]
        }
      };

      return Object.assign({}, state, { sampleList });
    }
    case 'UPDATE_TASK': {
      const sampleList = {
        ...state.sampleList,
        [action.sampleID]: {
          ...state.sampleList[action.sampleID],
          tasks:
          [
            ...state.sampleList[action.sampleID].tasks.slice(0, action.taskIndex),
            action.taskData,
            ...state.sampleList[action.sampleID].tasks.slice(action.taskIndex + 1)
          ]
        }
      };

      return Object.assign({}, state, { sampleList });
    }

    case 'CHANGE_TASK_ORDER': {
      const sampleList = Object.assign({}, state.sampleList);

      sampleList[action.sampleId].tasks = update(state.sampleList[action.sampleId].tasks, {
        $splice: [[action.oldIndex, 1],
                  [action.newIndex, 0,
                   state.sampleList[action.sampleId].tasks[action.oldIndex]]]
      });

      return { ...state, sampleList };
    }
    case 'SET_CURRENT_SAMPLE': {
      const sampleList = Object.assign({}, state.sampleList);
      sampleList[action.sampleID].state |= SAMPLE_MOUNTED;
      return Object.assign({}, state, { sampleList });
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

      for (const key of action.keys) {
        selectedItems[key] = action.selected;
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
    case 'SET_INITIAL_STATE': {
      const sampleList = { ...state.sampleList };

      for (const sampleID in action.data.queue.queue) {
        if (action.data.queue.queue.hasOwnProperty(sampleID)) {
          sampleList[sampleID] = action.data.queue.queue[sampleID];
        }
      }

      return { ...state, sampleList };
    }
    case 'CLEAR_ALL': {
      return Object.assign({}, state, { ...INITIAL_STATE });
    }
    default: {
      return state;
    }
  }
};
