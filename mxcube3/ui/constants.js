// Constants that are unused within this file but defined here
// for ease of reuse. However eslint complains as soon as they
// are not used within the same file. So disable eslint for this
// section

/* eslint-disable no-unused-vars */

export const QUEUE_STARTED = 'QueueStarted';
export const QUEUE_RUNNING = 'QueueRunning';
export const QUEUE_STOPPED = 'QueueStopped';
export const QUEUE_PAUSED = 'QueuePaused';
export const QUEUE_FAILED = 'QueueFailed';

export const SAMPLE_MOUNTED = 0x8;
export const TASK_COLLECTED = 0x4;
export const TASK_COLLECT_FAILED = 0x2;
export const TASK_COLLECT_WARNING = 0x3;
export const TASK_RUNNING = 0x1;
export const TASK_UNCOLLECTED = 0x0;

export const READY = 0;
export const RUNNING = 0x1;

export const AUTO_LOOP_CENTRING = 1;
export const CLICK_CENTRING = 0;


export function isCollected(task) {
  return task.state !== TASK_UNCOLLECTED;
}


/* eslint-enable no-unused-vars */

