/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/no-unused-state */

import PropTypes from 'prop-types';
import { Component } from 'react';
import { Button, Collapse, ProgressBar } from 'react-bootstrap';

import {
  TASK_COLLECT_FAILED,
  TASK_COLLECTED,
  TASK_RUNNING,
  TASK_UNCOLLECTED,
} from '../../constants';
import TooltipTrigger from '../TooltipTrigger';

export default class WorkflowTaskItem extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    moveCard: PropTypes.func.isRequired,
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
    const path = parameters.path || '';
    const pathEndPart = path.slice(-40);

    return (
      <TooltipTrigger id="wedge-path-tooltip" tooltipContent={path}>
        <a style={{ flexGrow: 1 }}>
          .../{pathEndPart.slice(pathEndPart.indexOf('/') + 1)}
        </a>
      </TooltipTrigger>
    );
  }

  progressBar() {
    const { state } = this.props;
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
      <span style={{ width: '150px', right: '60px', position: 'absolute' }}>
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

    let taskCSS = this.props.selected
      ? 'task-head task-head-selected'
      : 'task-head';

    switch (state) {
      case TASK_RUNNING: {
        taskCSS += ' running';

        break;
      }
      case TASK_COLLECTED: {
        taskCSS += ' success';

        break;
      }
      case TASK_COLLECT_FAILED: {
        taskCSS += ' error';

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
                  {this.pointIDString(parameters)} {data.parameters.label}
                  {state === TASK_RUNNING && this.progressBar()}
                </span>
              </b>
              {state === TASK_UNCOLLECTED && (
                <i
                  key="delete_task"
                  className="fa fa-times"
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
                  <div
                    style={{
                      borderTop: '1px solid #DDD',
                      padding: '0.5em',
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                    }}
                  >
                    <b>Path:</b>
                    {this.path(parameters)}
                    <Button
                      variant="outline-secondary"
                      style={{ width: '3em' }}
                      title="Copy path"
                      onClick={() => {
                        navigator.clipboard.writeText(`${parameters.path}`);
                      }}
                    >
                      <i
                        style={{ marginLeft: 0 }}
                        className="fa fa-copy"
                        aria-hidden="true"
                      />
                    </Button>
                    <Button
                      variant="outline-secondary"
                      style={{ width: '3em' }}
                      title="Open parameters dialog"
                      onClick={() =>
                        this.props.showWorkflowParametersDialog(null, true)
                      }
                    >
                      <i aria-hidden="true" className="fa fa-sliders-h" />
                    </Button>
                  </div>
                  {this.getResult(state)}
                </div>
              </div>
            </div>
          </Collapse>
        </div>
      </div>
    );
  }
}
