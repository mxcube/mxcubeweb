/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-unused-prop-types */

import PropTypes from 'prop-types';
import { Component } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { TASK_COLLECTED } from '../../constants';
import TaskItemContainer from './TaskItemContainer';

export default class EnergyScanTaskItem extends Component {
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
        dataLabel={data.label}
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
      </TaskItemContainer>
    );
  }
}
