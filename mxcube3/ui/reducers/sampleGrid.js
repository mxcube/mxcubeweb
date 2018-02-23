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
                                         puckFilter: '',
                                         limsFilter: false,
                                         useFilter: false } };


export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_QUEUE': {
      const sampleList = { ...state.sampleList };
      return { ...state, sampleList: Object.assign(sampleList, action.sampleList) };
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
    case 'REMOVE_SAMPLES_FROM_QUEUE': {
      // When removing samples from queue, remove uncollected tasks from that sample in
      // the sample list.
      const sampleList = { ...state.sampleList };


      return { ...state, sampleList };
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
    case 'UPDATE_TASK_LIMS_DATA': {
      const sampleList = {
        ...state.sampleList,
        [action.sampleID]: {
          ...state.sampleList[action.sampleID],
          tasks: [
            ...state.sampleList[action.sampleID].tasks.slice(0, action.taskIndex),
            {
              ...state.sampleList[action.sampleID].tasks[action.taskIndex],
              limsResultData: action.limsResultData,
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
    case 'ADD_DIFF_PLAN': {
      // Similar as ADD_TASKS but we link the char task with the diff plan dc
      // Can we expect more than one dc as diff plan?
      const sampleList = { ...state.sampleList };
      action.tasks.forEach((t) => {
        const task = { ...t, state: 0 };
        const originID = task.originID;
        // first we find which char task is the origin
        /* eslint-disable no-param-reassign */
        sampleList[task.sampleID].tasks.forEach((tt) => {
          if (tt.queueID === originID && tt.type === 'Characterisation') {
            tt.diffractionPlanID = task.queueID;
            tt.diffractionPlan = action.tasks;
          }
        });
        /* eslint-enable no-param-reassign */
        if (task.parameters.prefix === '') {
          task.parameters.prefix = sampleList[task.sampleID].defaultPrefix;
        }
        sampleList[task.sampleID] = {
          ...sampleList[task.sampleID],
          tasks: [...sampleList[task.sampleID].tasks],
          state: TASK_UNCOLLECTED
        };
      });

      return Object.assign({}, state, { sampleList });
    }
    case 'PLOT_END': {
      const sampleList = { ...state.sampleList };
      /* eslint-disable no-param-reassign */
      Object.keys(sampleList).forEach((sampleId) => {
        sampleList[sampleId].tasks.forEach((tt) => {
          if (tt.queueID === action.id && tt.type === action.dataType) {
            tt.result = action.data;
            tt.diffractionPlan = action.tasks;
          }
        });
      });
      /* eslint-enable no-param-reassign */

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
    case 'SET_SAMPLE_ATTRIBUTE': {
      const sampleList = Object.assign({}, state.sampleList);
      sampleList[action.sampleID][action.attr] = action.value;
      return { ...state, sampleList };
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
      const sampleList = { ...action.data.queue.sampleList.sampleList };
      const order = [...action.data.queue.sampleList.sampleOrder];
      return { ...state, sampleList, order };
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
