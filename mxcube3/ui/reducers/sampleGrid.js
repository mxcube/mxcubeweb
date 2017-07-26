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
import { SAMPLE_MOUNTED, TASK_UNCOLLECTED } from '../constants';

const INITIAL_STATE = { selected: {},
                        sampleList: {},
                        order: [],
                        moving: {},
                        filterOptions: { text: '',
                                         inQueue: false,
                                         notInQueue: false,
                                         collected: false,
                                         notCollected: false,
                                         useFilter: false } };


export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_QUEUE': {
      return { ...state, sampleList: Object.assign(state.sampleList, action.queue) };
    }
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
    case 'ADD_SAMPLES_TO_QUEUE': {
      const sampleIDList = action.samplesData.map((s) => s.sampleID);
      const sampleList = { ...state.sampleList };
      sampleIDList.forEach((sampleID, i) => {
        sampleList[sampleID].tasks.length > 0 ?
          sampleList[sampleID].tasks.concat(action.samplesData[i].tasks) :
          sampleList[sampleID].tasks = action.samplesData[i].tasks; });

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
          state: TASK_UNCOLLECTED
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

      const task = sampleList[action.sampleId].tasks[action.oldIndex];
      const tempTask = sampleList[action.sampleId].tasks[action.newIndex];

      sampleList[action.sampleId].tasks[action.newIndex] = task;
      sampleList[action.sampleId].tasks[action.oldIndex] = tempTask;

      return { ...state, sampleList };
    }
    case 'SET_CURRENT_SAMPLE': {
      const sampleList = Object.assign({}, state.sampleList);

      // We might want to set current sample to be nothing in that case do
      // do nothing.
      if (action.sampleID) {
        sampleList[action.sampleID].state |= SAMPLE_MOUNTED;
      }

      return Object.assign({}, state, { sampleList });
    }
    // Toggles a samples movable flag
    case 'TOGGLE_MOVABLE_SAMPLE': {
      const moving = { };
      moving[action.key] = (!state.moving[action.key]);
      return Object.assign({}, state, { moving });
    }
    // Select a range of samples
    case 'SELECT_SAMPLES': {
      const selectedItems = {};
      const movingItems = {};

      for (const key of action.keys) {
        selectedItems[key] = action.selected;
        movingItems[key] = (state.moving[key] && state.selected[key]);
      }

      return Object.assign({}, state, { selected: selectedItems, moving: movingItems });
    }
    case 'TOGGLE_SELECTED_SAMPLE': {
      const selected = Object.assign({}, state.selected);
      selected[action.sampleID] = (!state.selected[action.sampleID]);
      return Object.assign({}, state, { selected });
    }
    case 'FILTER_SAMPLE_LIST': {
      const filterOptions = Object.assign({}, state.filterOptions, action.filterOptions);
      return Object.assign({}, state, { filterOptions });
    }
    case 'SET_INITIAL_STATE': {
      const sampleList = { ...state.sampleList };

      for (const sampleID in action.data.queue.queue) {
        if (action.data.queue.queue.hasOwnProperty(sampleID)) {
          sampleList[sampleID] = action.data.queue.queue[sampleID];
          const pref = `${sampleList[sampleID].sampleName}-${sampleList[sampleID].proteinAcronym}`;
          sampleList[sampleID].defaultPrefix = pref;
        }
      }

      return { ...state, sampleList };
    }
    case 'CLEAR_SAMPLE_GRID': {
      return Object.assign({}, state, { ...INITIAL_STATE });
    }
    case 'CLEAR_ALL': {
      return Object.assign({}, state, { ...INITIAL_STATE });
    }
    default: {
      return state;
    }
  }
};
