/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { SAMPLE_MOUNTED, TASK_UNCOLLECTED } from '../constants';

interface QueueNode {
  checked: boolean;
  queueID: number;
  state: number; // a bitmask -- see constants.ts
  type: string;
}

export interface TaskParameters {
  [param: string]: unknown;
  prefix: string;
}

// reflects TaskNodeModel from the backend. Exact shape may differ between tasks.
export interface TaskNode extends QueueNode {
  diffractionPlan: TaskNode[] | null;
  diffractionPlanID: number | null;
  label: string;
  name: string | null;
  originID?: number;
  parameters: TaskParameters;
  result?: unknown;
  sampleID: string;
  sampleQueueID: number | null;
  taskIndex: number | null;
}

export interface Sample extends QueueNode {
  cellA?: number;
  cellAlpha?: number;
  cellB?: number;
  cellBeta?: number;
  cellC?: number;
  cellGamma?: number;
  cell_no: number;
  code: string | null;
  containerCode?: string;
  crystalSpaceGroup?: string;
  crystalUUID?: string;
  defaultPrefix: string | null;
  defaultSubDir: string | null;
  experimentType?: string;
  image_url?: string;
  image_x?: number | string;
  image_y?: number | string;
  limsID?: number;
  limsLink?: string;
  lims_location?: string;
  loadable?: boolean;
  location: string;
  proteinAcronym: string | null;
  puck_barcode?: string;
  puck_no: number;
  puck_type?: string;
  sampleID: string;
  sampleName: string;
  sample_barcode?: string;
  sc_state?: number;
  smiles?: string | null;
  tasks: TaskNode[];
}

export type SampleList = Record<string, Sample>;

export interface Crystal {
  column: number;
  crystal_uuid: string;
  image_date: string;
  image_url: string;
  offset_x: number;
  offset_y: number;
  row: string;
  sample: string;
  shelf: number;
}

export interface CrystalList {
  xtal_list: Crystal[];
}

export interface FilterOptions {
  cellFilter: string;
  collected: boolean;
  inQueue: boolean;
  notCollected: boolean;
  notInQueue: boolean;
  puckFilter: string;
  text: string;
}

export interface SampleGridState {
  crystalList: CrystalList;
  filterOptions: FilterOptions;
  /** Whether the sample with the given ID is currently being moved */
  moving: Record<string, boolean>;
  order: string[];
  sampleList: SampleList;
  /** Whether the sample with the given ID is currently selected */
  selected: Record<string, boolean>;
}

interface SetQueueAction {
  type: 'SET_QUEUE';
  sampleOrder: string[];
  sampleList: SampleList;
}

interface SetCurrentSampleAction {
  type: 'SET_CURRENT_SAMPLE';
  sampleID: string;
}

interface AddTasksAction {
  type: 'ADD_TASKS';
  tasks: TaskNode[];
}

interface AddTaskResultAction {
  type: 'ADD_TASK_RESULT';
  sampleID: string;
  taskIndex: number;
  state: number;
}

interface RemoveTaskAction {
  type: 'REMOVE_TASK';
  sampleID: string;
  taskIndex: number;
}

interface RemoveTasksListAction {
  type: 'REMOVE_TASKS_LIST';
  taskList: TaskNode[];
}

interface PlotEndAction {
  type: 'PLOT_END';
  id: number;
  dataType: string;
  data: unknown;
}

interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: {
    queue: {
      sampleList: { sampleList: SampleList; sampleOrder: string[] };
    };
  };
}

const INITIAL_STATE: SampleGridState = {
  selected: {},
  sampleList: {},
  crystalList: { xtal_list: [] },
  order: [],
  moving: {},
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

function withDefaultPrefix(task: TaskNode, sample: Sample) {
  if (task.parameters.prefix !== '') {
    return task;
  }

  return {
    ...task,
    parameters: { ...task.parameters, prefix: sample.defaultPrefix ?? '' },
  };
}

const sampleGridSlice = createSlice({
  name: 'sampleGrid',
  initialState: INITIAL_STATE,
  reducers: {
    updateSampleList(
      state,
      action: PayloadAction<{ sampleList: SampleList; order: string[] }>,
    ) {
      state.sampleList = action.payload.sampleList;
      state.order = action.payload.order;
      state.selected = {};
    },
    updateCrystalList(state, action: PayloadAction<CrystalList>) {
      state.crystalList = action.payload;
    },
    addSamples(state, action: PayloadAction<Sample[]>) {
      action.payload.forEach((sample) => {
        state.sampleList[sample.sampleID] = sample;
        state.order.push(sample.sampleID);
      });
    },
    updateSampleState(
      state,
      action: PayloadAction<{ sampleID: string; state: number }>,
    ) {
      state.sampleList[action.payload.sampleID].sc_state = action.payload.state;
    },
    setSampleChecked(
      state,
      action: PayloadAction<{ sampleIDList: string[]; value: boolean }>,
    ) {
      const { sampleIDList, value } = action.payload;
      sampleIDList.forEach((sampleID) => {
        state.sampleList[sampleID].checked = value;
      });
    },
    updateTask(
      state,
      action: PayloadAction<{
        sampleID: string;
        taskIndex: number;
        taskData: TaskNode;
      }>,
    ) {
      const { sampleID, taskIndex, taskData } = action.payload;
      state.sampleList[sampleID].tasks[taskIndex] = taskData;
    },
    addDiffractionPlan(state, action: PayloadAction<TaskNode[]>) {
      const plan = action.payload.map((task) =>
        withDefaultPrefix(task, state.sampleList[task.sampleID]),
      );

      action.payload.forEach((task) => {
        const sample = state.sampleList[task.sampleID];

        sample.tasks.forEach((candidate) => {
          if (
            candidate.queueID === task.originID &&
            candidate.type === 'Characterisation'
          ) {
            candidate.diffractionPlanID = task.queueID;
            candidate.diffractionPlan = plan;
          }
        });

        sample.state = TASK_UNCOLLECTED;
      });
    },
    // Selects a range of samples, deselecting every sample outside of it
    selectSamples(
      state,
      action: PayloadAction<{ keys: string[]; selected?: boolean }>,
    ) {
      const { keys, selected = true } = action.payload;
      const selectedItems: Record<string, boolean> = {};
      const movingItems: Record<string, boolean> = {};

      keys.forEach((key) => {
        selectedItems[key] = selected;
        movingItems[key] = state.moving[key] && state.selected[key];
      });

      state.selected = selectedItems;
      state.moving = movingItems;
    },
    filterSampleList(state, action: PayloadAction<Partial<FilterOptions>>) {
      state.filterOptions = { ...state.filterOptions, ...action.payload };
    },
    clearSampleGrid() {
      return INITIAL_STATE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('SET_QUEUE', (state, action: SetQueueAction) => {
        state.sampleList = action.sampleList;
        state.order = action.sampleOrder;
      })
      .addCase('SET_INITIAL_STATE', (state, action: SetInitialStateAction) => {
        const { sampleList, sampleOrder } = action.data.queue.sampleList;
        state.sampleList = sampleList;
        state.order = sampleOrder;
      })
      .addCase(
        'SET_CURRENT_SAMPLE',
        (state, action: SetCurrentSampleAction) => {
          // The current sample may be set to nothing, and the sample changer may
          // report a sample that is not in the list; in both cases do nothing.
          if (action.sampleID && action.sampleID in state.sampleList) {
            state.sampleList[action.sampleID].state |= SAMPLE_MOUNTED; // eslint-disable-line no-bitwise
          }
        },
      )
      .addCase('ADD_TASKS', (state, action: AddTasksAction) => {
        action.tasks.forEach((task) => {
          const sample = state.sampleList[task.sampleID];

          sample.tasks.push(
            withDefaultPrefix({ ...task, state: TASK_UNCOLLECTED }, sample),
          );
          sample.state = TASK_UNCOLLECTED;
        });
      })
      .addCase('ADD_TASK_RESULT', (state, action: AddTaskResultAction) => {
        const task = state.sampleList[action.sampleID].tasks[action.taskIndex];
        task.checked = false;
        task.state = action.state;
      })
      .addCase('REMOVE_TASK', (state, action: RemoveTaskAction) => {
        state.sampleList[action.sampleID].tasks.splice(action.taskIndex, 1);
      })
      .addCase('REMOVE_TASKS_LIST', (state, action: RemoveTasksListAction) => {
        action.taskList.forEach((removed) => {
          const sample = state.sampleList[removed.sampleID];
          sample.tasks = sample.tasks.filter(
            (task) => task.queueID !== removed.queueID,
          );
        });
      })
      .addCase('PLOT_END', (state, action: PlotEndAction) => {
        Object.values(state.sampleList).forEach((sample) => {
          sample.tasks.forEach((task) => {
            if (task.queueID === action.id && task.type === action.dataType) {
              task.result = action.data;
            }
          });
        });
      });
  },
});

export const {
  updateSampleList,
  updateCrystalList,
  addSamples,
  updateSampleState,
  setSampleChecked,
  updateTask,
  addDiffractionPlan,
  selectSamples,
  filterSampleList,
  clearSampleGrid,
} = sampleGridSlice.actions;

export default sampleGridSlice.reducer;
