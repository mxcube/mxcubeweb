import { ProgressBar } from 'react-bootstrap';

import { deleteTask } from '../../actions/queue';
import { showTaskForm } from '../../actions/taskForm';
import {
  groupSummary,
  TASK_COLLECT_FAILED,
  TASK_COLLECTED,
  TASK_RUNNING,
  TASK_SKIPPED,
  TASK_UNCOLLECTED,
} from '../../constants';
import { useAppDispatch, useAppSelector } from '../../ts-store';
import ElapsedTime from './ElapsedTime';
import styles from './Item.module.css';

const STATE_STYLES = {
  [TASK_RUNNING]: styles.taskRunning,
  [TASK_COLLECTED]: styles.taskSuccess,
  [TASK_SKIPPED]: styles.taskWarning,
  [TASK_COLLECT_FAILED]: styles.taskError,
};

const STATE_ICONS = {
  [TASK_UNCOLLECTED]: ['far fa-circle', 'Waiting'],
  [TASK_RUNNING]: ['fas fa-circle-notch fa-spin', 'Running'],
  [TASK_COLLECTED]: ['fas fa-check-circle', 'Done'],
  [TASK_SKIPPED]: ['fas fa-exclamation-circle', 'Skipped'],
  [TASK_COLLECT_FAILED]: ['fas fa-times-circle', 'Failed'],
};

function stateIcon(state) {
  const [icon, title] = STATE_ICONS[state] || STATE_ICONS[TASK_UNCOLLECTED];
  return <i className={`${icon} ${styles.stateIcon}`} title={title} />;
}

/**
 * An unattended collect: a header and one row per task of its task group.
 *
 * @param {Object} props
 * @param {Array} props.tasks - The task rows of the group, in order
 * @param {number} props.index - Index of the first row in the sample's tasks
 */
export default function UnattendedCollectItem({ tasks, index }) {
  const dispatch = useAppDispatch();
  const displayData = useAppSelector((state) => state.queueGUI.displayData);

  const [first] = tasks;
  const summary = groupSummary(tasks);
  const pending = summary.state === TASK_UNCOLLECTED && summary.done === 0;

  return (
    <div className={styles.nodeSample}>
      <div
        className={`${styles.taskHead} ${STATE_STYLES[summary.state] || ''}`}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <span className={styles.nodeName} style={{ fontWeight: 'bold' }}>
          {stateIcon(summary.state)}
          Unattended collect ({summary.done}/{tasks.length}
          {summary.running && ` — ${summary.running}`})
        </span>
        <ElapsedTime
          className={styles.elapsed}
          startedAt={summary.startedAt}
          endedAt={summary.endedAt}
        />
        {pending && (
          <>
            <i
              className={`fas fa-pen ${styles.editTask}`}
              title="Edit the acquisition parameters"
              onClick={() =>
                dispatch(
                  showTaskForm('UnattendedCollect', first.sampleID, first, -1),
                )
              }
            />
            <i
              className={`fas fa-times ${styles.delTask}`}
              style={{ marginLeft: 0 }}
              title="Remove the unattended collect"
              onClick={() => dispatch(deleteTask(first.sampleID, index))}
            />
          </>
        )}
      </div>

      {tasks.map((task, i) => {
        const { progress = 0 } = displayData[task.queueID] || {};

        return (
          <div
            key={task.queueID}
            className={`${styles.groupTask} ${
              task.state === TASK_RUNNING ? styles.groupTaskRunning : ''
            }`}
          >
            {stateIcon(task.state)}
            {i + 1}. {task.label}
            {task.state === TASK_SKIPPED && <em className="ms-2">skipped</em>}
            {task.state === TASK_RUNNING && progress > 0 && (
              <ProgressBar
                variant="info"
                striped
                animated
                className={styles.progressBar}
                min={0}
                max={1}
                now={progress}
              />
            )}
            <ElapsedTime
              className={styles.elapsed}
              startedAt={task.startedAt}
              endedAt={task.endedAt}
            />
          </div>
        );
      })}
    </div>
  );
}
