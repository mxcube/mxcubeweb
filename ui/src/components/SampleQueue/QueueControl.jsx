/* eslint-disable react/jsx-handler-names */
/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import './app.css';
import { Button, Navbar, Nav } from 'react-bootstrap';
import {
  QUEUE_RUNNING,
  QUEUE_PAUSED,
  QUEUE_STOPPED,
  QUEUE_STARTED,
} from '../../constants';

import QueueSettings from '../../containers/QueueSettings';
import loader from '../../img/busy-indicator.gif';

export default class QueueControl extends React.Component {
  constructor(props) {
    super(props);

    this.nextSample = this.nextSample.bind(this);

    this.state = {
      options: {
        [QUEUE_STARTED]: [
          {
            text: 'Stop',
            class: 'btn-danger',
            action: props.stopQueue,
            key: 1,
          },
        ],
        [QUEUE_RUNNING]: [
          {
            text: 'Stop',
            class: 'btn-danger',
            action: props.stopQueue,
            key: 1,
          },
        ],
        [QUEUE_STOPPED]: [
          {
            text: 'Run Queue',
            class: 'btn-success',
            action: props.startQueue,
            key: 1,
          },
        ],
        [QUEUE_PAUSED]: [
          {
            text: 'Stop',
            class: 'btn-danger',
            action: props.stopQueue,
            key: 1,
          },
        ],
      },
    };

    this.sampleState = {
      options: {
        [QUEUE_STARTED]: [
          {
            text: 'Pause',
            class: 'btn-warning',
            action: this.props.pauseQueue,
            key: 2,
          },
        ],
        [QUEUE_RUNNING]: [
          {
            text: 'Pause',
            class: 'btn-warning',
            action: this.props.pauseQueue,
            key: 2,
          },
        ],
        [QUEUE_STOPPED]: [],
        [QUEUE_PAUSED]: [
          {
            text: 'Resume',
            class: 'btn-success',
            action: this.props.resumeQueue,
            key: 2,
          },
        ],
        NoSampleMounted: [
          {
            text: 'New Sample',
            class: 'btn-primary',
            action: this.showForm,
            key: 1,
          },
        ],
        LastSample: [
          {
            text: 'Unmount',
            class: 'btn-primary',
            action: this.nextSample,
            key: 1,
          },
        ],
      },
    };
  }

  nextSample() {
    const idx = this.props.queue.indexOf(this.props.mounted);

    if (idx !== -1) {
      // a sample is mounted but not in the queue.
      this.props.setEnabledSample([this.props.queue[idx]], false);
    }

    if (this.props.queue[idx + 1]) {
      this.props.runSample(this.props.queue[idx + 1]);
    } else {
      this.props.unmountSample();
    }
  }

  renderOption(option) {
    return (
      <Button
        className={option.class}
        variant=""
        size="sm"
        onClick={option.action}
        key={option.key}
      >
        {option.text}
      </Button>
    );
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  render() {
    let nextSample = [];
    let queueOptions = [];
    let sampleQueueOptions = [];
    if (this.props.queue) {
      const idx = this.props.queue.indexOf(this.props.mounted);
      if (this.props.queue[idx + 1]) {
        const sampleData =
          this.props.sampleList[this.props.queue[idx + 1]] || {};
        const sampleName = sampleData.sampleName || '';
        const proteinAcronym = sampleData.proteinAcronym
          ? `${sampleData.proteinAcronym} - `
          : '';

        nextSample = [
          {
            text: `Next Sample (${proteinAcronym}${sampleName})`,
            class: 'btn-outline-secondary',
            action: this.nextSample,
            key: 2,
          },
        ];
      }

      this.sampleState.options[QUEUE_STOPPED] = nextSample;

      const sampleId = this.props.mounted;
      queueOptions = this.state.options[this.props.queueStatus];
      if (sampleId) {
        if (
          this.props.queue.length === idx + 1 &&
          this.props.queueStatus === QUEUE_STOPPED
        ) {
          sampleQueueOptions = this.sampleState.options.LastSample;
        } else {
          sampleQueueOptions = this.sampleState.options[this.props.queueStatus];
        }
      }
    }

    const running = this.props.queueStatus === QUEUE_RUNNING;
    const showBusyIndicator = running ? 'inline' : 'none';

    return (
      <Navbar className="m-tree" style={{ padding: '0.5em' }}>
        <Nav
          className="me-auto my-2 my-lg-0"
          style={{ maxHeight: '100px' }}
          navbarScroll
        >
          <Nav.Item>
            <span style={{ marginRight: '0.6em' }}>
              {queueOptions.map((option) => this.renderOption(option))}
            </span>
            <span>
              {sampleQueueOptions.map((option) => this.renderOption(option))}
            </span>
          </Nav.Item>
          <Nav.Item>
            <img
              src={loader}
              style={{ display: showBusyIndicator, marginLeft: '25%' }}
              alt=""
            />
          </Nav.Item>
        </Nav>
        <QueueSettings />
      </Navbar>
    );
  }
}
