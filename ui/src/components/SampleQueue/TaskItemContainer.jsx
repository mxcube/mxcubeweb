import { Component } from 'react';
import { Collapse, ProgressBar } from 'react-bootstrap';

import {
  TASK_COLLECT_FAILED,
  TASK_COLLECTED,
  TASK_RUNNING,
  TASK_UNCOLLECTED,
} from '../../constants';
import styles from './Item.module.css';

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
      diffractionPlanLength = undefined,
      pointIDString,
      progress,
      selected,
      show,
      showContextMenu,
      specialTaskCSS = '',
      state,
    } = this.props;

    const delTaskCSS = {
      display: 'flex',
      marginLeft: 'auto',
      alignItems: 'center',
      paddingLeft: '10px',
      paddingRight: '10px',
      color: '#d9534f',
      cursor: 'pointer',
    };

    let taskCSS = selected ? styles.taskHeadSelected : styles.taskHead;
    let pbarBsStyle = 'info';

    switch (state) {
      case TASK_RUNNING: {
        taskCSS += ` ${styles.taskRunning}`;
        pbarBsStyle = 'info';
        break;
      }
      case TASK_COLLECTED: {
        pbarBsStyle = 'success';
        if (
          specialTaskCSS === 'Characterisation' &&
          diffractionPlanLength === undefined
        ) {
          taskCSS += ` ${styles.taskWarning}`;
          break;
        }
        taskCSS += ` ${styles.taskSuccess}`;
        break;
      }
      case TASK_COLLECT_FAILED: {
        taskCSS += ` ${styles.taskError}`;
        pbarBsStyle = 'danger';
        break;
      }
      // No default
    }

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
              <b>
                <span className="node-name" style={{ display: 'flex' }}>
                  {pointIDString} {dataLabel}
                  {state === TASK_RUNNING && (
                    <span
                      style={{
                        width: '150px',
                        right: '60px',
                        position: 'absolute',
                      }}
                    >
                      <ProgressBar
                        variant={pbarBsStyle}
                        striped
                        style={{ marginBottom: 0, height: '18px' }}
                        min={0}
                        max={1}
                        animated={progress < 1}
                        label={`${(progress * 100).toPrecision(3)} %`}
                        now={progress}
                      />
                    </span>
                  )}
                </span>
              </b>
              {state === TASK_UNCOLLECTED && (
                <i
                  className="fas fa-times"
                  onClick={this.deleteTask}
                  style={delTaskCSS}
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
