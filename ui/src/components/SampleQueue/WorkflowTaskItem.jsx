/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-unused-prop-types */

import PropTypes from 'prop-types';
import { Component } from 'react';
import { Button } from 'react-bootstrap';

import { TASK_COLLECTED } from '../../constants';
import TooltipTrigger from '../TooltipTrigger';
import TaskItemContainer from './TaskItemContainer';

export default class WorkflowTaskItem extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
    this.showForm = this.showForm.bind(this);
    this.getResult = this.getResult.bind(this);
    this.pointIDString = this.pointIDString.bind(this);
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

  render() {
    const {
      data,
      deleteTask,
      progress,
      sampleId,
      selected,
      show,
      showContextMenu,
      state,
      taskHeaderOnClickHandler,
      taskHeaderOnContextMenuHandler,
    } = this.props;

    const { parameters } = data;

    return (
      <TaskItemContainer
        dataLabel={data.parameters.label}
        deleteTask={deleteTask}
        index={this.props.index}
        pointIDString={this.pointIDString(parameters)}
        progress={progress}
        sampleId={sampleId}
        selected={selected}
        show={show}
        showContextMenu={showContextMenu}
        specialTaskCSS="Characterisation"
        state={state}
        taskHeaderOnClickHandler={taskHeaderOnClickHandler}
        taskHeaderOnContextMenuHandler={taskHeaderOnContextMenuHandler}
      >
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
      </TaskItemContainer>
    );
  }
}
