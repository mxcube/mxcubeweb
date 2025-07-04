/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/no-unused-state */

import PropTypes from 'prop-types';
import { Component } from 'react';
import {
  Button,
  Collapse,
  OverlayTrigger,
  Popover,
  ProgressBar,
} from 'react-bootstrap';

import {
  TASK_COLLECT_FAILED,
  TASK_COLLECTED,
  TASK_RUNNING,
  TASK_UNCOLLECTED,
} from '../../constants';

export default class EnergyScanTaskItem extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
    this.showForm = this.showForm.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.toggleChecked = this.toggleChecked.bind(this);
    this.taskHeaderOnClick = this.taskHeaderOnClick.bind(this);
    this.taskHeaderOnContextMenu = this.taskHeaderOnContextMenu.bind(this);
    this.getResult = this.getResult.bind(this);
    this.pointIDString = this.pointIDString.bind(this);
    this.state = {
      overInput: false,
      selected: false,
    };
  }

  getResult(state) {
    if (state !== TASK_COLLECTED) {
      return <span />;
    }
    const link = this.props.data.limsResultData
      ? this.props.data.limsResultData.limsTaskLink
      : '';

    return (
      <div
        style={{
          borderLeft: '1px solid #DDD',
          borderRight: '1px solid #DDD',
          borderBottom: '1px solid #DDD',
          padding: '0.5em',
        }}
      >
        <a href={link} target="_blank" rel="noreferrer">
          {' '}
          View Results in ISPyB
        </a>
      </div>
    );
  }

  toggleChecked() {
    this.props.toggleChecked(this.props.sampleId, this.props.index);
  }

  taskHeaderOnClick(e) {
    this.props.taskHeaderOnClickHandler(e, this.props.index);
  }

  taskHeaderOnContextMenu(e) {
    this.props.taskHeaderOnContextMenuHandler(e, this.props.index);
  }

  deleteTask(e) {
    e.stopPropagation();
    this.props.deleteTask(this.props.sampleId, this.props.index);
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  deleteButton() {
    let content = (
      <Button size="sm" onClick={this.deleteTask}>
        Delete
      </Button>
    );

    if (this.props.state !== TASK_UNCOLLECTED) {
      content = <span> </span>;
    }

    return content;
  }

  showForm() {
    const { data, sampleId } = this.props;
    const { type, parameters } = data;
    this.props.showForm(type, sampleId, data, parameters.shape);
  }

  pointIDString(parameters) {
    let res = '';

    if (parameters.shape !== -1) {
      try {
        res = `${this.props.shapes.shapes[parameters.shape].name}: `;
      } catch {
        res = '';
      }
    }

    return res;
  }

  path(parameters) {
    const value = parameters.fileName;
    const path = parameters.path || '';

    return (
      <OverlayTrigger
        trigger="click"
        placement="top"
        rootClose
        overlay={
          <Popover
            id="wedge-popover"
            style={{ maxWidth: '2000px', width: 'auto' }}
          >
            <input
              type="text"
              onFocus={(e) => {
                e.target.select();
              }}
              value={path}
              size={path.length + 10}
            />
          </Popover>
        }
      >
        <a onClick={(e) => e.stopPropagation()}>{value}</a>
      </OverlayTrigger>
    );
  }

  render() {
    const { state, data, show } = this.props;

    const { parameters } = data;

    const delTaskCSS = {
      display: 'flex',
      marginLeft: 'auto',
      alignItems: 'center',
      paddingLeft: '10px',
      paddingRight: '10px',
      color: '#d9534f',
      cursor: 'pointer',
    };

    const taskCSS = this.props.selected
      ? 'task-head task-head-selected'
      : 'task-head';

    let pbarBsStyle = 'info';

    switch (state) {
      case TASK_RUNNING: {
        pbarBsStyle = 'info';

        break;
      }
      case TASK_COLLECTED: {
        pbarBsStyle = 'success';

        break;
      }
      case TASK_COLLECT_FAILED: {
        pbarBsStyle = 'danger';

        break;
      }
      // No default
    }

    return (
      <div className="node node-sample">
        <div
          onContextMenu={(e) =>
            this.props.showContextMenu(e, 'currentSampleQueueContextMenu')
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
                  {this.pointIDString(parameters)} {data.label}
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
                      animated={this.props.progress < 1}
                      label={`${(this.props.progress * 100).toPrecision(3)} %`}
                      now={this.props.progress}
                    />
                  </span>
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
          <Collapse in={Boolean(show)}>
            <div className="task-body">
              <div>
                <div style={{ border: '1px solid #DDD' }}>
                  <div style={{ padding: '0.5em' }} onClick={this.showForm}>
                    <b>Path:</b> {this.path(parameters)}
                    <br />
                    <b>Element:</b> {parameters.element}
                    <br />
                    <b>Edge:</b> {parameters.edge}
                  </div>
                </div>
                {this.getResult(state)}
              </div>
            </div>
          </Collapse>
        </div>
      </div>
    );
  }
}
