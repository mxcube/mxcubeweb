import React from 'react';
import fetch from 'isomorphic-fetch';

import { isUnCollected, taskHasLimsData } from '../../constants';

export class LimsResultSummary extends React.Component {
  componentDidMount() {
    this.getResults(this.props.taskData);
  }

  getResults(taskData) {
    const task = this.props.taskData;

    if (!isUnCollected(task)) {
      const resultCont = this.refs.resultContainer;
      resultCont.innerHTML = 'Loading results, please wait ...';

      fetch('mxcube/api/v0.1/lims/results', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({ qid: taskData.queueID })
      }).then((response) => {
        if (response.status >= 400) {
          return false;
        }

        return response.json();
      }).then((data) => {
        if (data.result !== undefined && data.result !== null &&
            data.result !== 'undefined' && data.result !== 'null') {
          resultCont.innerHTML = data.result;
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

  render() {
    const task = this.props.taskData;
    let style = {};// resize: 'both', overflow: 'auto' };

    return (
      <div ref="limsResultSummary" className="lims-result-summary" style={ style }>
        { !taskHasLimsData(task) ? this.taskSummary() : null }
        <div ref="resultContainer" className="result-container" style= {{ overflow: 'hidden' }}>
        </div>
      </div>
    );
  }
}
