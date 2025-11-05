/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Badge, OverlayTrigger, Popover } from 'react-bootstrap';

import {
  TASK_COLLECT_FAILED,
  TASK_COLLECT_WARNING,
  TASK_COLLECTED,
  TASK_RUNNING,
  TASK_UNCOLLECTED,
} from '../../constants';
import { DataCollectionResultSummary } from '../DataCollectionResult/DataCollectionResultSummary';
import styles from './TaskItem.module.css';

export class TaskItem extends React.Component {
  static defaultProps = {
    taskData: {},
    taskIndex: '',
  };

  constructor(props) {
    super(props);
    this.taskItemOnClick = this.taskItemOnClick.bind(this);
    this.deleteButtonOnClick = this.deleteButtonOnClick.bind(this);

    this.tagName = this.tagName.bind(this);
    this.summary = this.summary.bind(this);
    this.title = this.title.bind(this);
    this.stateClass = this.stateClass.bind(this);
  }

  tagName() {
    const { type } = this.props.taskData;
    let res = 'DC';

    switch (type) {
      case 'DataCollection': {
        res = 'DC';

        break;
      }
      case 'Characterisation': {
        res = 'C';

        break;
      }
      case 'Workflow': {
        res = 'WF';

        break;
      }
      case 'xrf_spectrum': {
        res = 'XRF';

        break;
      }
      case 'energy_scan': {
        res = 'ESCAN';

        break;
      }
      // No default
    }

    return res;
  }

  summary() {
    const task = this.props.taskData;
    const filePath = this.props.taskData.parameters.fullPath;
    return (
      <div>
        <div className="row">
          <span style={{ paddingBottom: '0.5em' }} className="col-sm-12">
            <b>Path: {filePath}</b>
          </span>
          <span className="col-sm-3">Oscillation range:</span>
          <span className="col-sm-3">{task.parameters.osc_range}&deg;</span>
          <span className="col-sm-3">First image</span>
          <span className="col-sm-3">{task.parameters.first_image}</span>

          <span className="col-sm-3">Oscillation start:</span>
          <span className="col-sm-3">{task.parameters.osc_start}&deg;</span>
          <span className="col-sm-3">Number of images</span>
          <span className="col-sm-3">{task.parameters.num_images}</span>

          <span className="col-sm-3">Exposure time:</span>
          <span className="col-sm-3">{`${task.parameters.exp_time}s`}</span>
          <span className="col-sm-3">Transmission</span>
          <span className="col-sm-3">{`${task.parameters.transmission} %`}</span>

          <span className="col-sm-3">Energy:</span>
          <span className="col-sm-3">{`${task.parameters.energy} keV`}</span>
          <span className="col-sm-3">Resolution</span>
          <span className="col-sm-3">{`${task.parameters.resolution} Å`}</span>
        </div>
      </div>
    );
  }

  title() {
    const task = this.props.taskData;
    let taskStatus = 'To be collected';

    if (task.state === TASK_RUNNING) {
      taskStatus = 'In progress';
    } else if (task.state === TASK_COLLECTED) {
      taskStatus = 'Collected';
    }

    return `${task.label} (${taskStatus})`;
  }

  stateClass() {
    const task = this.props.taskData;

    let variant = 'primary';

    if (task.state === TASK_RUNNING) {
      variant = 'warning';
    }
    if (task.state === TASK_COLLECT_FAILED) {
      variant = 'danger';
    }
    if (task.state === TASK_COLLECT_WARNING) {
      variant = 'danger';
    } else if (task.state === TASK_COLLECTED) {
      variant = 'success';
    }

    return variant;
  }

  taskItemOnClick() {
    const task = this.props.taskData;
    this.props.showDialog(true, 'LIMS_RESULT_DIALOG', 'Lims Results', task);
  }

  deleteButtonOnClick(e) {
    if (this.props.deleteButtonOnClick) {
      this.props.deleteButtonOnClick(
        e,
        this.props.taskData.sampleID,
        this.props.taskIndex,
      );
    }
  }

  render() {
    const style = {
      display: 'inline-block',
      margin: 0,
      cursor: 'pointer',
      fontSize: '0.7em',
      scrollSnapAlign: 'center',
    };
    const task = this.props.taskData;

    return (
      <div key={this.props.taskIndex}>
        <OverlayTrigger
          rootClose="true"
          placement="auto"
          overlay={
            <Popover
              className={`${styles.taskSummaryPopover} p-2`}
              id="taskSummaryPopover"
              title={<b>{this.title()}</b>}
            >
              <DataCollectionResultSummary
                taskData={this.props.taskData}
                scale="0.5"
              />
            </Popover>
          }
        >
          <Badge
            bg={this.stateClass()}
            style={style}
            onClick={this.taskItemOnClick}
          >
            {this.tagName()}
            {task.state === TASK_UNCOLLECTED ? (
              <i
                style={{ cursor: 'pointer' }}
                className="ms-1 fas fa-times"
                onClick={this.deleteButtonOnClick}
              />
            ) : (
              <span />
            )}
          </Badge>
        </OverlayTrigger>
      </div>
    );
  }
}
