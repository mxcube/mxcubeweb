import { Collapse, ProgressBar } from 'react-bootstrap';
import { contextMenu } from 'react-contexify';
import { useDispatch, useSelector } from 'react-redux';

import { deleteTask } from '../../actions/queue';
import { collapseItem, selectItem } from '../../actions/queueGUI';
import {
  TASK_COLLECT_FAILED,
  TASK_COLLECTED,
  TASK_RUNNING,
  TASK_UNCOLLECTED,
} from '../../constants';
import styles from './Item.module.css';

const stateBasedStyles = {
  [TASK_RUNNING]: styles.taskRunning,
  [TASK_COLLECTED]: styles.taskSuccess,
  [TASK_COLLECT_FAILED]: styles.taskError,
};

/**
 * @typedef {Object} TaskData
 * @property {string} queueID
 * @property {string} type
 * @property {string} label
 * @property {{ label: string }} [parameters]
 * @property {Array<any>} [diffractionPlan]
 */

/**
 * Task item container component.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Nested child elements
 * @param {TaskData} props.data - Task data object
 * @param {number} props.index - Index of the task in the queue
 * @param {string} props.pointIDString - ID string displayed in the UI
 * @returns {JSX.Element}
 */
export default function TaskItemContainer({
  children,
  data,
  index,
  pointIDString,
}) {
  const dispatch = useDispatch();
  const currentSampleID = useSelector((state) => state.queue.currentSampleID);
  const displayData = useSelector(
    (state) => state.queueGUI.displayData[data.queueID] || {},
  );
  const taskState = useSelector(
    (state) =>
      state.sampleGrid.sampleList[currentSampleID]?.tasks[index]?.state,
  );

  function handleContextMenu(e) {
    e.preventDefault();
    contextMenu.show({
      id: 'currentSampleQueueContextMenu',
      event: e,
      props: {
        taskIndex: index,
      },
    });
  }

  function taskHeaderOnClick(e) {
    if (e.ctrlKey) {
      dispatch(selectItem(data.queueID));
    } else {
      dispatch(collapseItem(data.queueID));
    }
  }

  function taskHeaderOnKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      taskHeaderOnClick(e);
    }
  }

  function onDeleteTask(e) {
    e.stopPropagation();
    dispatch(deleteTask(currentSampleID, index));
  }

  let taskCSS = displayData.selected
    ? styles.taskHeadSelected
    : styles.taskHead;

  // there is a special css style for emitting a warning signal
  // if a diffraction task is collected but no diffraction plan is present
  if (
    data.type === 'Characterisation' &&
    taskState === TASK_COLLECTED &&
    data.diffractionPlan.length === undefined
  ) {
    taskCSS += ` ${styles.taskWarning}`;
  } else {
    taskCSS += ` ${stateBasedStyles[taskState] || ''}`;
  }

  const dataLabel = data.type.includes('Workflow')
    ? data.parameters.label
    : data.label;

  return (
    <div className={styles.nodeSample}>
      <div onContextMenu={(e) => handleContextMenu(e)}>
        <div
          role="button"
          tabIndex={0}
          onClick={taskHeaderOnClick}
          onKeyDown={taskHeaderOnKeyDown}
          aria-expanded={!displayData.collapsed}
          aria-controls={`collapse-${data.queueID}`}
          className={taskCSS}
          style={{ display: 'flex' }}
        >
          <span className={styles.nodeName} style={{ fontWeight: 'bold' }}>
            {pointIDString} {dataLabel}
          </span>
          {taskState === TASK_RUNNING && (
            <ProgressBar
              variant="info"
              striped
              className={styles.progressBar}
              min={0}
              max={1}
              animated={displayData.progress < 1}
              label={`${(displayData.progress * 100).toPrecision(3)} %`}
              now={displayData.progress}
            />
          )}

          {taskState === TASK_UNCOLLECTED && (
            <i
              className={`fas fa-times ${styles.delTask}`}
              onClick={onDeleteTask}
            />
          )}
        </div>
        <Collapse id={`collapse-${data.queueID}`} in={displayData.collapsed}>
          {children}
        </Collapse>
      </div>
    </div>
  );
}
