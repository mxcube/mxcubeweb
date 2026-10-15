// Constants that are unused within this file but defined here
// for ease of reuse. However eslint complains as soon as they
// are not used within the same file. So disable eslint for this
// section

export const QUEUE_STATUS = {
  RUNNING: 'QueueRunning',
  STOPPED: 'QueueStopped',
  PAUSED: 'QueuePaused',
  FAILED: 'QueueFailed',
} as const;

export type QueueStatus = (typeof QUEUE_STATUS)[keyof typeof QUEUE_STATUS];

export const QUEUE_RUNNING = QUEUE_STATUS.RUNNING;
export const QUEUE_STOPPED = QUEUE_STATUS.STOPPED;
export const QUEUE_PAUSED = QUEUE_STATUS.PAUSED;
export const QUEUE_FAILED = QUEUE_STATUS.FAILED;

export const SAMPLE_MOUNTED = 0x8;
export const TASK_COLLECTED = 0x4;
export const TASK_COLLECT_FAILED = 0x2;
export const TASK_COLLECT_WARNING = 0x3;
export const TASK_RUNNING = 0x1;
export const TASK_UNCOLLECTED = 0x0;
/** The queue reached the task and skipped it, e.g. no spots to collect on. */
export const TASK_SKIPPED = 0x10;

export const READY = 0;
export const RUNNING = 0x1;

export const CENTRING_METHOD = {
  MANUAL: 0,
  LOOP: 1,
  FULLY_AUTOMATIC: 2,
  XRAY: 3,
  NONE: 4,
} as const;

export type CentringMethod =
  (typeof CENTRING_METHOD)[keyof typeof CENTRING_METHOD];

export const TWO_STATE_ACTUATOR = 'INOUT';

/** `state` is a bitmask of the TASK_* flags, not a single one of them. */
interface TaskState {
  state: number;
}

export function isCollected(task: TaskState): boolean {
  return (task.state & TASK_COLLECTED) === TASK_COLLECTED; // eslint-disable-line no-bitwise
}

export function isUnCollected(task: TaskState): boolean {
  return task.state === TASK_UNCOLLECTED;
}

const TASK_END_STATES = new Set([
  TASK_COLLECTED,
  TASK_COLLECT_FAILED,
  TASK_SKIPPED,
]);

/** Rows of a task group (e.g. the tasks of an unattended collect). */
export function isGroupHead(
  task: { groupID?: number | null },
  i: number,
  tasks: { groupID?: number | null }[],
): boolean {
  return (
    typeof task.groupID === 'number' && tasks[i - 1]?.groupID !== task.groupID
  );
}

/** State, progress and timing of a task group, from its rows. */
export function groupSummary(
  rows: (TaskState & { label: string; startedAt?: number; endedAt?: number })[],
): {
  state: number;
  done: number;
  running?: string;
  startedAt?: number;
  endedAt?: number;
} {
  const ended = rows.filter((row) => TASK_END_STATES.has(row.state));
  const running = rows.find((row) => row.state === TASK_RUNNING);
  const done = ended.length === rows.length;
  let state: number = TASK_UNCOLLECTED;

  if (running) {
    state = TASK_RUNNING;
  } else if (rows.some((row) => row.state === TASK_COLLECT_FAILED)) {
    state = TASK_COLLECT_FAILED;
  } else if (done) {
    state = rows.every((row) => row.state === TASK_COLLECTED)
      ? TASK_COLLECTED
      : TASK_SKIPPED;
  }

  return {
    state,
    done: ended.length,
    running: running?.label,
    startedAt: rows[0]?.startedAt,
    endedAt: done ? rows.at(-1)?.endedAt : undefined,
  };
}

export function twoStateActuatorIsActive(state: string): boolean {
  return ['in', 'on', 'enabled'].includes(state.toLowerCase());
}

export const SPACE_GROUPS = [
  '',
  'P1',
  'P2',
  'P21',
  'C2',
  'P222',
  'P2221',
  'P21212',
  'P212121',
  'C222 ',
  'C2221',
  'F222',
  'I222',
  'I212121',
  'P4',
  'P41',
  'P42',
  'P43',
  'P422',
  'P4212',
  'P4122',
  'P41212',
  'P4222',
  'P42212',
  'P4322',
  'P43212',
  'I4',
  'I41',
  'I422',
  'I4122',
  'P3',
  'P31',
  'P32',
  'P312',
  'P321',
  'P3112',
  'P3121',
  'P3212',
  'P3221',
  'P6',
  'P61',
  'P65',
  'P62',
  'P64',
  'P63',
  'P622',
  'P6122',
  'P6522',
  'P6222',
  'P6422',
  'P6322',
  'R3',
  'R32',
  'P23',
  'P213',
  'P432',
  'P4232',
  'P4332',
  'P4132',
  'F23',
  'F432',
  'F4132',
  'I23',
  'I213',
  'I432',
  'I4132',
] as const;

/*
 * Base hardware object states: https://github.com/mxcube/mxcubecore/blob/03c89f2eef8af604b211f5788813df3ad4216138/mxcubecore/BaseHardwareObjects.py#L61
 * Also used for motors: https://github.com/mxcube/mxcubecore/blob/03c89f2eef8af604b211f5788813df3ad4216138/mxcubecore/HardwareObjects/abstract/AbstractMotor.py#L40
 */
export const HW_STATE = {
  UNKNOWN: 'UNKNOWN',
  WARNING: 'WARNING',
  BUSY: 'BUSY',
  READY: 'READY',
  FAULT: 'FAULT',
  OFF: 'OFF',
} as const;

/**
 * Sample List View Modes
 */
export const SAMPLE_LIST_VIEW_MODES = {
  graphical_view: 'Graphical View',
  table_view: 'Table View',
} as const;
