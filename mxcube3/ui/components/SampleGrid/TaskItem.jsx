import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import './SampleGrid.css';
import { TASK_COLLECTED,
         TASK_COLLECT_FAILED,
         TASK_COLLECT_WARNING,
         TASK_RUNNING } from '../../constants';

export class TaskItem extends React.Component {

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
    const type = this.props.taskData.type;
    let res = 'DC';

    if (type === 'DataCollection') {
      res = 'DC';
    } else if (type === 'Characterisation') {
      res = 'C';
    } else if (type === 'Workflow') {
      res = 'AS';
    }

    return res;
  }

  summary() {
    const task = this.props.taskData;
    let filePath = this.props.taskData.parameters.fullPath;
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
          <span className="col-sm-3">{`${task.parameters.energy} KeV`}</span>
          <span className="col-sm-3">Resolution</span>
          <span className="col-sm-3">{`${task.parameters.resolution} Å`}</span>
        </div>
      </div>
   );
  }

  result() {
    const task = this.props.taskData;
    let content = (<div></div>);
    let lImageUrl = '';
    let fImageUrl = '';

    const r = task.limsResultData;

    if (task.limsResultData && Object.keys(task.limsResultData).length > 0) {
      if (task.limsResultData.firstImageId) {
        fImageUrl = '/mxcube/api/v0.1/lims/dc/thumbnail/';
        fImageUrl += task.limsResultData.firstImageId.toString();
      }

      if (task.limsResultData.lastImageId) {
        lImageUrl = '/mxcube/api/v0.1/lims/dc/thumbnail/';
        lImageUrl += task.limsResultData.lastImageId.toString();
      }

      const sFlux = parseInt(r.flux, 10) / Math.pow(10, 9);
      const eFlux = parseInt(r.flux_end, 10) / Math.pow(10, 9);

      content = (
        <div>
          <div
            className="row"
            style={ { paddingLeft: '1em', paddingTop: '1em', paddingBottom: '0.2em' } }
          >
            <b>Status: {r.runStatus}</b>
          </div>

          <div className="row">
            <span className="col-sm-3">Resolution at collect</span>
            <span className="col-sm-3">{`${r.resolution || '-'} Å`}</span>
            <span className="col-sm-3">Resolution at corner:</span>
            <span className="col-sm-3">{`${r.resolutionAtCorner || '-'} Å`}</span>
          </div>

          <div className="row">
            <span className="col-sm-3">Wavelength</span>
            <span className="col-sm-3">{`${r.wavelength || '-'} Å`}</span>
            <span className="col-sm-3"> </span>
            <span className="col-sm-3"> </span>
          </div>

          <div className="row" style={ { paddingTop: '1em' } }>
            <span className="col-sm-2">Start time:</span>
            <span className="col-sm-4">{r.startTime || '-'}</span>
            <span className="col-sm-2">End time</span>
            <span className="col-sm-4">{r.endTime || '-'}</span>
          </div>

          <div className="row">
            <span className="col-sm-2">Flux at start:</span>
            <span className="col-sm-4">{sFlux || '-'}e+9 (Giga) ph/s</span>
            <span className="col-sm-2">Flux at end</span>
            <span className="col-sm-4">{eFlux || '-'}e+9 (Giga) ph/s</span>
          </div>

          <div className="row" style={ { paddingTop: '0.5em' } } >
            <span className="col-sm-6">
              <b>First image: </b>
              <img ref="fimage" alt="First" src={fImageUrl} />
            </span>
            <span className="col-sm-6">
              <b>Last image: </b>
              <img ref="limage" alt="Last" src={lImageUrl} />
            </span>
          </div>
        </div>
      );
    }

    return content;
  }

  title() {
    const task = this.props.taskData;
    const point = task.parameters.point !== -1 ? ` at P-${task.parameters.point}` : '';
    let taskStatus = 'To be collected';

    if (task.state === TASK_RUNNING) {
      taskStatus = 'In progress';
    } else if (task.state === TASK_COLLECTED) {
      taskStatus = 'Collected';
    }

    return `${task.label}${point} (${taskStatus})`;
  }

  stateClass() {
    const task = this.props.taskData;

    let cls = 'btn-primary';

    if (task.state === TASK_RUNNING) {
      cls = 'btn-warning';
    } if (task.state === TASK_COLLECT_FAILED) {
      cls = 'btn-danger';
    } if (task.state === TASK_COLLECT_WARNING) {
      cls = 'btn-danger';
    } else if (task.state === TASK_COLLECTED) {
      cls = 'btn-success';
    }

    return cls;
  }

  popoverPosition() {
    const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    let result = 'bottom';

    if (this.refs.sampleItem) {
      if (parseInt(this.refs.sampleItem.style.top, 10) <= (viewportHeight / 2)) {
        result = 'bottom';
      } else {
        result = 'top';
      }
    }

    return result;
  }


  taskItemOnClick(e) {
    const task = this.props.taskData;

    if (task.state === 0) {
      this.props.taskItemOnClick(e, task);
    } else {
      const limsLink = task.limsResultData.limsTaskLink ? task.limsResultData.limsTaskLink : '';
      window.open(limsLink);
    }
  }


  deleteButtonOnClick(e) {
    if (this.props.deleteButtonOnClick) {
      this.props.deleteButtonOnClick(e, this.props.taskData.sampleID, this.props.taskIndex);
    }
  }


  render() {
    const style = { display: 'inline-block', margin: '3px', cursor: 'pointer' };

    return (
      <div key={this.props.taskIndex} className="sample-grid-task-item">
        <OverlayTrigger
          trigger={['hover']}
          rootClose="true"
          ref="taskSummaryPopoverTrigger"
          placement={this.popoverPosition()}
          overlay={(
            <Popover
              id="taskSummaryPopover"
              style={{ minWidth: '700px', paddingBottom: '1em' }}
              title={(<b>{this.title()}</b>)}
            >
              {this.summary()}
              {this.result()}
            </Popover>) }
        >
          <span
            className={`${this.stateClass()} label`}
            style={style}
            onClick={this.taskItemOnClick}
          >
            {this.tagName()}
            <i className="fa fa-times" onClick={this.deleteButtonOnClick} />
          </span>
        </OverlayTrigger>
      </div>
    );
  }
}


TaskItem.defaultProps = {
  taskData: {},
  taskIndex: '',
};
