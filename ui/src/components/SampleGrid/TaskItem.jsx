import React from 'react';
import { OverlayTrigger, Popover, Badge } from 'react-bootstrap';
import { LimsResultSummary } from '../Lims/LimsResultSummary';

import './SampleGridTable.css';
import {
  TASK_COLLECTED,
  TASK_UNCOLLECTED,
  TASK_COLLECT_FAILED,
  TASK_COLLECT_WARNING,
  TASK_RUNNING,
  isUnCollected,
} from '../../constants';

import loader from '../../img/busy-indicator.gif';

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
    this.result = this.result.bind(this);
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

  result() {
    const task = this.props.taskData;
    let content = <div />;
    let lImageUrl = '';
    let fImageUrl = '';
    let qIndUrl = '';

    const r = task.limsResultData;

    if (
      !isUnCollected(task) &&
      task.limsResultData &&
      Object.keys(task.limsResultData).length > 0
    ) {
      if (task.limsResultData.firstImageId) {
        fImageUrl = '/mxcube/api/v0.1/lims/dc/thumbnail/';
        fImageUrl += task.limsResultData.firstImageId.toString();
      }

      if (task.limsResultData.lastImageId) {
        lImageUrl = '/mxcube/api/v0.1/lims/dc/thumbnail/';
        lImageUrl += task.limsResultData.lastImageId.toString();
      }

      if (task.limsResultData.dataCollectionId) {
        qIndUrl = '/mxcube/api/v0.1/lims/quality_indicator_plot/';
        qIndUrl += task.limsResultData.dataCollectionId.toString();
      }

      const sFlux = Number.parseInt(r.flux, 10) / 10 ** 9;
      const eFlux = Number.parseInt(r.flux_end, 10) / 10 ** 9;

      content = (
        <div>
          <div
            className="row"
            style={{
              paddingLeft: '1em',
              paddingTop: '1em',
              paddingBottom: '0.2em',
            }}
          >
            <b>Status: {r.runStatus}</b>
          </div>

          <div className="row">
            <span className="col-sm-3">Resolution at collect</span>
            <span className="col-sm-3">{`${r.resolution || '-'} Å`}</span>
            <span className="col-sm-3">Resolution at corner:</span>
            <span className="col-sm-3">{`${
              r.resolutionAtCorner || '-'
            } Å`}</span>
          </div>

          <div className="row">
            <span className="col-sm-3">Wavelength</span>
            <span className="col-sm-3">{`${r.wavelength || '-'} Å`}</span>
            <span className="col-sm-3"> </span>
            <span className="col-sm-3"> </span>
          </div>

          <div className="row" style={{ paddingTop: '1em' }}>
            <span className="col-sm-2">Start time:</span>
            <span className="col-sm-4">{r.startTime || '-'}</span>
            <span className="col-sm-2">End time</span>
            <span className="col-sm-4">{r.endTime || '-'}</span>
          </div>

          <div className="row">
            <span className="col-sm-2">Flux at start:</span>
            <span className="col-sm-4">{sFlux || '-'} ph/s</span>
            <span className="col-sm-2">Flux at end</span>
            <span className="col-sm-4">{eFlux || '-'} ph/s</span>
          </div>

          <div className="row" style={{ paddingTop: '0.5em' }}>
            <span className="col-sm-4">
              <b>Quality Indictor: </b>
              <img alt="First" src={qIndUrl} width="90%" />
            </span>
            <span className="col-sm-4">
              <b>First image: </b>
              <img alt="First" src={fImageUrl} width="90%" />
            </span>
            <span className="col-sm-4">
              <b>Last image: </b>
              <img alt="Last" src={lImageUrl} width="90%" />
            </span>
          </div>
        </div>
      );
    } else if (!isUnCollected(task)) {
      content = (
        <span>
          <img src={loader} alt="" /> Fetching data, please wait
        </span>
      );
    }

    return content;
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
    };
    const task = this.props.taskData;

    return (
      <div key={this.props.taskIndex} className=" ms-1 sample-grid-task-item">
        <OverlayTrigger
          rootClose="true"
          placement="auto"
          overlay={
            <Popover
              className="p-2"
              id="taskSummaryPopover"
              title={<b>{this.title()}</b>}
            >
              <LimsResultSummary taskData={this.props.taskData} scale="0.5" />
            </Popover>
          }
        >
          <Badge
            bg={this.stateClass()}
            style={style}
            onClick={this.taskItemOnClick}
            className="p-1 me-2"
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
