import React from 'react';
import 'bootstrap';
import './app.less';
import { ProgressBar, Button } from 'react-bootstrap';

export default class QueueControl extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      options: {
        QueueStarted: [
        { text: 'Stop', class: 'btn-danger', action: this.props.stop, key: 1 },
        { text: 'Pause', class: 'btn-warning pull-right', action: this.props.pause, key: 2 },
        ],
        QueueStopped: [
        { text: 'Run Queue', class: 'btn-success', action: this.showForm, key: 1 },
        ],
        QueuePaused: [
        { text: 'Stop', class: 'btn-danger', action: this.props.stop, key: 1 },
        { text: 'Unpause', class: 'btn-success pull-right', action: this.props.unpause, key: 2 }
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
          {queueOptions.map((option) => this.renderOptions(option))}
          <p className="queue-root">
            Total Progress {`${historyLength}/${totalSamples - current} `}:
          </p>
           <ProgressBar active now={progress} />
        </div>
      </div>
    );
  }
}
