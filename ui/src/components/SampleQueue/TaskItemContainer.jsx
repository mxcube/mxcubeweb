import { Component } from 'react';
import { Collapse, ProgressBar } from 'react-bootstrap';

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

export default class TaskItemContainer extends Component {
  constructor(props) {
    super(props);
    this.taskHeaderOnClick = this.taskHeaderOnClick.bind(this);
    this.taskHeaderOnContextMenu = this.taskHeaderOnContextMenu.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
  }

  taskHeaderOnClick(e) {
    const { index, taskHeaderOnClickHandler } = this.props;
    taskHeaderOnClickHandler(e, index);
  }

  taskHeaderOnContextMenu(e) {
    const { index, taskHeaderOnContextMenuHandler } = this.props;
    taskHeaderOnContextMenuHandler(e, index);
  }

  deleteTask(e) {
    e.stopPropagation();
    const { deleteTask, sampleId, index } = this.props;
    deleteTask(sampleId, index);
  }

  render() {
    const {
      children,
      dataLabel,
      pointIDString,
      progress,
      selected,
      show,
      showContextMenu,
      warningTaskCSS = false,
      state,
    } = this.props;

    let taskCSS = selected ? styles.taskHeadSelected : styles.taskHead;
    taskCSS += ` ${
      warningTaskCSS ? styles.taskWarning : stateBasedStyles[state] || ''
    }`;

    return (
      <div className={styles.nodeSample}>
        <div
          onContextMenu={(e) =>
            showContextMenu(e, 'currentSampleQueueContextMenu')
          }
          id="currentSampleQueueContextMenu"
        >
          <div
            onClick={this.taskHeaderOnClick}
            onContextMenu={this.taskHeaderOnContextMenu}
          >
            <div className={taskCSS} style={{ display: 'flex' }}>
              <span className={styles.nodeName} style={{ fontWeight: 'bold' }}>
                {pointIDString} {dataLabel}
              </span>
              {state === TASK_RUNNING && (
                <ProgressBar
                  variant="info"
                  striped
                  className={styles.progressBar}
                  min={0}
                  max={1}
                  animated={progress < 1}
                  label={`${(progress * 100).toPrecision(3)} %`}
                  now={progress}
                />
              )}

              {state === TASK_UNCOLLECTED && (
                <i
                  className={`fas fa-times ${styles.delTask}`}
                  onClick={this.deleteTask}
                />
              )}
            </div>
          </div>
          <Collapse in={Boolean(show)}>{children}</Collapse>
        </div>
      </div>
    );
  }
}
