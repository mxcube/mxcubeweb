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

const INITIAL_STATE = {
  selected: {},
  sampleList: {},
  crystalList: [],
  order: [],
  moving: {},
  viewMode: {
    mode: 'Table View',
    options: ['Table View', 'Graphical View'],
  },
  filterOptions: {
    text: '',
    inQueue: false,
    notInQueue: false,
    collected: false,
    notCollected: false,
    cellFilter: '',
    puckFilter: '',
  },
};

// eslint-disable-next-line complexity
function sampleGridReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_QUEUE': {
      return {
        ...state,
        sampleList: { ...action.sampleList },
      };
    }
    // Set the list of samples (sampleList), clearing any existing list
    case 'UPDATE_SAMPLE_LIST': {
      const { sampleList, order } = action;

      return { ...state, sampleList, order, selected: {} };
    }
    case 'UPDATE_CRYSTAL_LIST': {
      const { crystalList } = action;
      return { ...state, crystalList };
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
        const { sampleID } = sampleData;
        sampleList[sampleID] = { ...sampleData };
        order.push(sampleID);
      }

      return { ...state, sampleList, order };
    }
    case 'SET_SAMPLES_INFO': {
      const sampleList = {};
      Object.keys(state.sampleList).forEach((key) => {
        const sample = state.sampleList[key];
        let sampleInfo;
        for (sampleInfo of action.sampleInfoList) {
          if (sampleInfo.code) {
            // find sample with data matrix code
            if (sample.code === sampleInfo.code) {
              sampleList[key] = { ...sample, ...sampleInfo };
              break;
            }
          } else {
            // check with sample changer location
            const containerLocation = sampleInfo.containerSampleChangerLocation;
            const { sampleLocation } = sampleInfo;
            const limsLocation = `${containerLocation}:${sampleLocation}`;

            if (sample.location === limsLocation) {
              sampleList[key] = { ...sample, ...sampleInfo };
              break;
            }
          }
        }
        if (sampleList[key] === undefined) {
          sampleList[key] = { ...sample };
        }
      });
      return { ...state, sampleList };
    }
    case 'ADD_SAMPLES_TO_QUEUE': {
      const sampleIDList = action.samplesData.map((s) => s.sampleID);
      const sampleList = { ...state.sampleList };
      sampleIDList.forEach((sampleID, i) => {
        if (sampleList[sampleID].tasks.length > 0) {
          sampleList[sampleID].tasks = [
            ...sampleList[sampleID].tasks,
            ...action.samplesData[i].tasks,
          ];
        } else {
          sampleList[sampleID].tasks = action.samplesData[i].tasks;
        }
      });

      return { ...state, sampleList };
    }
    case 'ADD_TASK_RESULT': {
      const sampleList = {
        ...state.sampleList,
        [action.sampleID]: {
          ...state.sampleList[action.sampleID],
          tasks: [
            ...state.sampleList[action.sampleID].tasks.slice(
              0,
              action.taskIndex,
            ),
            {
              ...state.sampleList[action.sampleID].tasks[action.taskIndex],
              checked: false,
              state: action.state,
            },
            ...state.sampleList[action.sampleID].tasks.slice(
              action.taskIndex + 1,
            ),
          ],
        },
      };

      return { ...state, sampleList };
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
          state: TASK_UNCOLLECTED,
        };
      });

      return { ...state, sampleList };
    }
    case 'REMOVE_TASK': {
      const sampleList = {
        ...state.sampleList,
        [action.sampleID]: {
          ...state.sampleList[action.sampleID],
          tasks: [
            ...state.sampleList[action.sampleID].tasks.slice(
              0,
              action.taskIndex,
            ),
            ...state.sampleList[action.sampleID].tasks.slice(
              action.taskIndex + 1,
            ),
          ],
        },
      };

      return { ...state, sampleList };
    }
    case 'REMOVE_TASKS_LIST': {
      const sampleList = { ...state.sampleList };

      action.taskList.forEach((task) => {
        sampleList[task.sampleID].tasks = sampleList[
          task.sampleID
        ].tasks.filter((taskItem) => taskItem.queueID !== task.queueID);
      });

      return { ...state, sampleList };
    }
    case 'UPDATE_TASK': {
      const sampleList = {
        ...state.sampleList,
        [action.sampleID]: {
          ...state.sampleList[action.sampleID],
          tasks: [
            ...state.sampleList[action.sampleID].tasks.slice(
              0,
              action.taskIndex,
            ),
            action.taskData,
            ...state.sampleList[action.sampleID].tasks.slice(
              action.taskIndex + 1,
            ),
          ],
        },
      };

      return { ...state, sampleList };
    }
    case 'ADD_DIFF_PLAN': {
      // Similar as ADD_TASKS but we link the char task with the diff plan dc
      // Can we expect more than one dc as diff plan?
      const sampleList = { ...state.sampleList };
      action.tasks.forEach((t) => {
        const task = { ...t, state: 0 };
        const { originID } = task;
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
          state: TASK_UNCOLLECTED,
        };
      });

      return { ...state, sampleList };
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

      return { ...state, sampleList };
    }
    case 'SET_CURRENT_SAMPLE': {
      const sampleList = { ...state.sampleList };

      // We might want to set current sample to be nothing in that case do
      // do nothing.
      if (action.sampleID && sampleList[action.sampleID]) {
        sampleList[action.sampleID].state |= SAMPLE_MOUNTED; // eslint-disable-line no-bitwise
      }

      return { ...state, sampleList };
    }
    // Change view mode
    case 'SET_VIEW_MODE': {
      const viewMode = { ...state.viewMode };
      viewMode.mode = action.mode;
      return { ...state, viewMode };
    }

    case 'SET_SAMPLE_ATTRIBUTE': {
      const sampleList = { ...state.sampleList };
      action.sampleIDList.forEach((sid) => {
        sampleList[sid][action.attr] = action.value;
      });

      return { ...state, sampleList };
    }
    // Toggles a samples movable flag
    case 'TOGGLE_MOVABLE_SAMPLE': {
      const moving = {};
      moving[action.key] = !state.moving[action.key];
      return { ...state, moving };
    }
    // Select a range of samples
    case 'SELECT_SAMPLES': {
      const selectedItems = {};
      const movingItems = {};

      for (const key of action.keys) {
        selectedItems[key] = action.selected;
        movingItems[key] = state.moving[key] && state.selected[key];
      }

      return { ...state, selected: selectedItems, moving: movingItems };
    }
    case 'TOGGLE_SELECTED_SAMPLE': {
      const selected = { ...state.selected };
      selected[action.sampleID] = !state.selected[action.sampleID];
      return { ...state, selected };
    }
    case 'FILTER_SAMPLE_LIST': {
      const filterOptions = {
        ...state.filterOptions,
        ...action.filterOptions,
      };
      return { ...state, filterOptions };
    }
    case 'SET_INITIAL_STATE': {
      const sampleList = { ...action.data.queue.sampleList.sampleList };
      const order = [...action.data.queue.sampleList.sampleOrder];
      return { ...state, sampleList, order };
    }
    case 'CLEAR_SAMPLE_GRID': {
      return { ...state, ...INITIAL_STATE };
    }
    case 'CLEAR_ALL': {
      return { ...state, ...INITIAL_STATE };
    }
    default: {
      return state;
    }
  }
}

export default sampleGridReducer;
