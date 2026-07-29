/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type VisibleList = 'current' | 'todo' | 'chip';

interface TaskDisplayData {
  collapsed: boolean;
  selected: boolean;
  progress: number;
}

// mirrors TaskNodeModel from backend, in reality there may be additional
// fields for specific types of tasks.
interface TaskNode {
  type: string;
  queueID: number;
  checked: boolean;
  state: number;
  label: string;
  sampleID: string;
  sampleQueueID: number | null;
  taskIndex: number | null;
  diffractionPlan: TaskNode[] | null;
  diffractionPlanID: number | null;
  name: string | null;
}

interface SampleTasks {
  tasks: TaskNode[];
}

type SampleList = Record<string, SampleTasks>;

interface SetQueueAction {
  type: 'SET_QUEUE';
  sampleOrder: string[];
  sampleList: SampleList;
}

interface AddTasksAction {
  type: 'ADD_TASKS';
  tasks: TaskNode[];
}

interface AddTaskResultAction {
  type: 'ADD_TASK_RESULT';
  queueID: number;
  sampleID: string;
  state: 0x0 | 0x1 | 0x2 | 0x3 | 0x4 | 0x8; // see: constants.js
  taskIndex: number;
  progress: number;
}

interface RemoveTaskAction {
  type: 'REMOVE_TASK';
  queueID: number;
}

interface RemoveTasksListAction {
  type: 'REMOVE_TASKS_LIST';
  queueIDList: number[];
}

interface QueueLoadingAction {
  type: 'QUEUE_LOADING';
  loading: boolean;
}

interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: {
    queue: {
      sampleList: { sampleList: SampleList; sampleOrder: string[] };
    };
  };
}

interface QueueGUIState {
  displayData: Record<number, TaskDisplayData>;
  visibleList: VisibleList;
  loading: boolean;
  showResumeQueueDialog: boolean;
  showConfirmCollectDialog: boolean;
}

const INITIAL_STATE: QueueGUIState = {
  displayData: {},
  visibleList: 'current',
  loading: false,
  showResumeQueueDialog: false,
  showConfirmCollectDialog: false,
};

function createTaskDisplayData(): TaskDisplayData {
  return { collapsed: false, selected: false, progress: 0 };
}

// Adds display data for tasks that don't have any yet, synchronizes
// the `displayData` state with sampleList on it's modification.
function addMissingTaskDisplayData(
  state: QueueGUIState,
  sampleList: SampleList,
  sampleOrder: string[],
) {
  sampleOrder.forEach((sampleID) => {
    if (sampleID in sampleList) {
      sampleList[sampleID].tasks.forEach((task) => {
        if (!(task.queueID in state.displayData)) {
          state.displayData[task.queueID] = createTaskDisplayData();
        }
      });
    }
  });
}

// Drops the display data of the given tasks, e.g. once they are deleted from
// the queue.
function removeTaskDisplayData(state: QueueGUIState, queueIDs: number[]) {
  const removedIDs = new Set(queueIDs.map(String));

  state.displayData = Object.fromEntries(
    Object.entries(state.displayData).filter(
      ([queueID]) => !removedIDs.has(queueID),
    ),
  );
}

const queueGUISlice = createSlice({
  name: 'queueGUI',
  initialState: INITIAL_STATE,
  reducers: {
    showList(state, action: PayloadAction<VisibleList>) {
      state.visibleList = action.payload;
    },
    collapseItem(state, action: PayloadAction<number>) {
      // The task may already have been removed from the queue
      if (action.payload in state.displayData) {
        const task = state.displayData[action.payload];
        task.collapsed = !task.collapsed;
      }
    },
    selectItem(state, action: PayloadAction<number>) {
      if (action.payload in state.displayData) {
        const task = state.displayData[action.payload];
        task.selected = !task.selected;
      }
    },
    showResumeQueueDialog(state, action: PayloadAction<boolean>) {
      state.showResumeQueueDialog = action.payload;
    },
    showConfirmCollectDialog(state, action: PayloadAction<boolean>) {
      state.showConfirmCollectDialog = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('SET_QUEUE', (state, action: SetQueueAction) => {
        addMissingTaskDisplayData(state, action.sampleList, action.sampleOrder);
      })
      .addCase('SET_INITIAL_STATE', (state, action: SetInitialStateAction) => {
        const { sampleList, sampleOrder } = action.data.queue.sampleList;
        addMissingTaskDisplayData(state, sampleList, sampleOrder);
      })
      .addCase('ADD_TASKS', (state, action: AddTasksAction) => {
        action.tasks.forEach((task) => {
          state.displayData[task.queueID] = createTaskDisplayData();
        });
      })
      .addCase('ADD_TASK_RESULT', (state, action: AddTaskResultAction) => {
        if (action.queueID in state.displayData) {
          state.displayData[action.queueID].progress = action.progress;
        }
      })
      .addCase('REMOVE_TASK', (state, action: RemoveTaskAction) => {
        removeTaskDisplayData(state, [action.queueID]);
      })
      .addCase('REMOVE_TASKS_LIST', (state, action: RemoveTasksListAction) => {
        removeTaskDisplayData(state, action.queueIDList);
      })
      .addCase('QUEUE_LOADING', (state, action: QueueLoadingAction) => {
        state.loading = action.loading;
      });
  },
});

export const {
  showList,
  collapseItem,
  selectItem,
  showResumeQueueDialog,
  showConfirmCollectDialog,
} = queueGUISlice.actions;

export default queueGUISlice.reducer;
