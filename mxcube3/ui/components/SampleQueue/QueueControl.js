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
        ],
        QueueStopped: [
        { text: 'Run Queue', class: 'btn-success', action: this.showForm, key: 1 },
        ],
        QueuePaused: [
        { text: 'Run Queue', class: 'btn-success', action: this.showForm, key: 1 },
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
        </div>
      </div>
    );
  }
}
