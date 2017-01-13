import React from 'react';
import 'bootstrap';
import './app.less';
import { ProgressBar, Button, Input } from 'react-bootstrap';
import { QUEUE_RUNNING, QUEUE_PAUSED, QUEUE_STOPPED } from '../../constants';

export default class QueueControl extends React.Component {

  constructor(props) {
    super(props);

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
    const { historyLength, todoLength, currentNode } = this.props;
    const totalSamples = historyLength + todoLength + 1;
    const progress = (100 / totalSamples) * historyLength;
    const current = currentNode ? 0 : 1;

    const queueOptions = this.state.options[this.props.queueStatus];

    return (
      <div className="m-tree">
        <div className="list-head">
          <div className="left">
            {queueOptions.map((option) => this.renderOptions(option))}
            <span className="queue-root">
            Total Progress {`${historyLength}/${totalSamples - current} `}:
          </span>
          </div>
          <div className="right">
            <ProgressBar active now={progress} />
          </div>
          <div style={ { marginLeft: '20px' } }>
            <span><Input type="checkbox" name="autoLoopCentring" /> Auto loop centring </span>
            <span><Input type="checkbox" name="autoMountNext" /> Automount next sample </span>
          </div>
        </div>
      </div>
    );
  }
}
