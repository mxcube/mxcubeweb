import React from 'react';
import fetch from 'isomorphic-fetch';

import { isUnCollected } from '../../constants';

import loader from '../../img/busy-indicator.gif';

export class LimsResultSummary extends React.Component {

  componentDidUpdate() {
    this.getResults(this.props.taskData);
  }

  getResults(taskData) {
    const task = this.props.taskData;

    if (!isUnCollected(task) && task.limsResultData) {
      const resultContList = document.getElementsByClassName('result-container');

      fetch('mxcube/api/v0.1/lims/results', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify(taskData)
      }).then((response) => {
        if (response.status >= 400) {
          return false;
        }

        return response.json();
      }).then((data) => {
        for (let i = 0; i < resultContList.length; i++) {
          resultContList[i].innerHTML = data.result;
        }
      });
    }
  }

  taskSummary() {
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

  limsResult() {
    const task = this.props.taskData;
    let content = (<div></div>);
    let lImageUrl = '';
    let fImageUrl = '';
    let qIndUrl = '';

    const r = task.limsResultData;

    if (!isUnCollected(task) && task.limsResultData &&
        Object.keys(task.limsResultData).length > 0) {
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
            <span className="col-sm-4">{sFlux || '-'} ph/s</span>
            <span className="col-sm-2">Flux at end</span>
            <span className="col-sm-4">{eFlux || '-'} ph/s</span>
          </div>

          <div className="row" style={ { paddingTop: '0.5em' } } >
            <span className="col-sm-4">
              <b>Quality Indictor: </b>
              <img ref="fimage" alt="First" src={qIndUrl} width="90%" />
            </span>
            <span className="col-sm-4">
              <b>First image: </b>
              <img ref="fimage" alt="First" src={fImageUrl} width="90%" />
            </span>
            <span className="col-sm-4">
              <b>Last image: </b>
              <img ref="limage" alt="Last" src={lImageUrl} width="90%" />
            </span>
          </div>
        </div>
      );
    } else if (!isUnCollected(task)) {
      content = (<span>
                   <img src={loader} role="presentation" />  Fetching data, please wait
                 </span>);
    }

    return content;
  }

  render() {
    return (
      <div className="lims-result-summary">
        <div className="result-container"></div>
      </div>
    );
  }
}
