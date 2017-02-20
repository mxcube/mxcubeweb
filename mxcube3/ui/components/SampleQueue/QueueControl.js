import React from 'react';
import './app.less';
import { ProgressBar, Button, Input } from 'react-bootstrap';
import { QUEUE_RUNNING, QUEUE_PAUSED, QUEUE_STOPPED } from '../../constants';

export default class QueueControl extends React.Component {
  constructor(props) {
    super(props);

    this.autoMountNextOnClick = this.autoMountNextOnClick.bind(this);

    this.state = {
      options: {
        [QUEUE_RUNNING]: [
        { text: 'Stop', class: 'btn-danger', action: props.stopQueue, key: 1 },
        ],
        [QUEUE_STOPPED]: [
        { text: 'Run', class: 'btn-success', action: props.runQueue, key: 1 },
        ],
        [QUEUE_PAUSED]: [
        { text: 'Run', class: 'btn-success', action: props.runQueue, key: 1 },
        ]
      }
    };
  }

  autoMountNextOnClick(e) {
    this.props.setAutoMountSample(e.target.checked);
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
    let progress = (100 / queueLength) * historyLength;
    const queueOptions = this.state.options[this.props.queueStatus];

    if (this.props.todoLength === 0) {
      progress = 0;
    }

    return (
      <div className="m-tree">
        <div className="list-head">
          <div className="left">
            {queueOptions.map((option) => this.renderOptions(option))}
            <span className="queue-root">
              Total Progress {`${historyLength}/${queueLength} `}:
            </span>
          </div>
          <div className="right">
            <ProgressBar active now={progress} />
          </div>
        <div style={ { marginLeft: '20px' } }>
            <span>
              <Input
                type="checkbox"
                name="autoMountNext"
                onClick={this.autoMountNextOnClick}
                checked={this.props.autoMountNext}
              />
              Automount next sample
            </span>
            <span>
              <Input
                type="checkbox"
                name="autoLoopCentring"
              />
              Auto loop centring
            </span>
          </div>
        </div>
      </div>
    );
  }
}
