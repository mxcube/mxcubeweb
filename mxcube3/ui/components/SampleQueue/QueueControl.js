import React from 'react';
import './app.less';
import { Button, Checkbox } from 'react-bootstrap';
import { QUEUE_RUNNING, QUEUE_PAUSED, QUEUE_STOPPED } from '../../constants';

export default class QueueControl extends React.Component {
  constructor(props) {
    super(props);

    this.autoMountNextOnClick = this.autoMountNextOnClick.bind(this);
    this.nextSample = this.nextSample.bind(this);

    this.state = {
      options: {
        [QUEUE_RUNNING]: [
        { text: 'Stop', class: 'btn-danger', action: props.stopQueue, key: 1 },
        ],
        [QUEUE_STOPPED]: [
        { text: 'Run Queue', class: 'btn-success', action: props.runQueue, key: 1 },
        ],
        [QUEUE_PAUSED]: [
        { text: 'Run Queue', class: 'btn-success', action: props.runQueue, key: 1 },
        ]
      }
    };

    this.sampleState = {
      options: {
        [QUEUE_RUNNING]: [
          { text: 'Pause', class: 'btn-warning', action: this.props.pause, key: 2 },
        ],
        [QUEUE_STOPPED]: [
          { text: 'Mount Next Sample', class: 'btn-primary', action: this.nextSample, key: 2 }
        ],
        [QUEUE_PAUSED]: [
          { text: 'Unpause', class: 'btn-success', action: this.props.unpause, key: 2 }
        ],
        NoSampleMounted: [
          { text: 'New Sample', class: 'btn-primary', action: this.showForm, key: 1 },
        ],
        LastSample: [
          { text: 'Finish', class: 'btn-primary', action: this.unMountSample, key: 1 }
        ]
      }
    };
  }

  nextSample() {
    if (this.props.todoList[0]) {
      this.props.runSample(this.props.todoList[0]);
    }
  }

  autoMountNextOnClick(e) {
    this.props.setAutoMountSample(e.target.checked);
  }

  renderSampleOptions(option) {
    return (
      <Button
        className={option.class}
        bsSize="sm"
        onClick={option.action}
        key={option.key}
      >
        {option.text}
      </Button>
    );
  }

  renderOptions(option) {
    return (
      <Button
        className={option.class}
        bsSize="sm"
        onClick={option.action}
        key={option.key}
      >
        {option.text}
      </Button>
    );
  }

  render() {
    const { queueLength, historyLength } = this.props;
    const sampleId = this.props.mounted;
    const queueOptions = this.state.options[this.props.queueStatus];

    let sampleQueueOptions = [];

    if (sampleId) {
      if (this.props.todoList.length === 0 && this.props.queueStatus === QUEUE_STOPPED) {
        sampleQueueOptions = this.sampleState.options.LastSample;
      } else {
        sampleQueueOptions = this.sampleState.options[this.props.queueStatus];
      }
    }

    return (
      <div className="m-tree">
        <div className="list-head">
          <div className="left">
            <span style={{ marginRight: '0.5em' }}>
              {queueOptions.map((option) => this.renderOptions(option))}
            </span>
            <span>
              {sampleQueueOptions.map((option) => this.renderSampleOptions(option))}
            </span>
            <span className="queue-root right">
              Total Progress {`${historyLength}/${queueLength} `}
            </span>
          </div>
          <div>
            <Checkbox
              name="autoMountNext"
              onClick={this.autoMountNextOnClick}
              checked={this.props.autoMountNext}
            >
              Automount next sample
            </Checkbox>
            <Checkbox
              name="autoLoopCentring"
            >
              Auto loop centring
           </Checkbox>
          </div>
        </div>
      </div>
    );
  }
}
