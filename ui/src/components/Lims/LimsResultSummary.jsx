/* eslint-disable promise/prefer-await-to-then */
import React from 'react';

import { fetchLimsResults } from '../../api/lims';
import { isUnCollected, taskHasLimsData } from '../../constants';

export class LimsResultSummary extends React.Component {
  componentDidMount() {
    this.getResults(this.props.taskData);
  }

  getResults(taskData) {
    const task = this.props.taskData;

    if (!isUnCollected(task)) {
      const resultCont = this.resultContainer;
      resultCont.innerHTML = 'Loading results, please wait ...';

      // eslint-disable-next-line promise/catch-or-return
      fetchLimsResults(taskData.queueID).then((json) => {
        if (
          json.result !== undefined &&
          json.result !== null &&
          json.result !== 'undefined' &&
          json.result !== 'null'
        ) {
          resultCont.innerHTML = json.result;
        }
      });
    }
  }

  taskSummary() {
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

  render() {
    const task = this.props.taskData;
    const style = {}; // resize: 'both', overflow: 'auto' };

    return (
      <div
        // ref="limsResultSummary"
        ref={(ref) => {
          this.limsResultSummary = ref;
        }}
        className="lims-result-summary"
        style={style}
      >
        {!taskHasLimsData(task) && this.taskSummary()}
        <div
          // ref="resultContainer"
          ref={(ref) => {
            this.resultContainer = ref;
          }}
          className="result-container"
          style={{ overflow: 'hidden' }}
        />
      </div>
    );
  }
}
