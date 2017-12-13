import React from 'react';
import './app.less';
import { Button, Checkbox, DropdownButton } from 'react-bootstrap';
import { QUEUE_RUNNING, QUEUE_PAUSED, QUEUE_STOPPED, QUEUE_STARTED,
         AUTO_LOOP_CENTRING, CLICK_CENTRING } from '../../constants';

import NumSnapshotsDropDown from '../../containers/NumSnapshotsDropDown.jsx';
import GroupFolderInput from '../../containers/GroupFolderInput.jsx';


export default class QueueControl extends React.Component {
  constructor(props) {
    super(props);

    this.autoMountNextOnClick = this.autoMountNextOnClick.bind(this);
    this.setAutoAddDiffPlan = this.setAutoAddDiffPlan.bind(this);
    this.nextSample = this.nextSample.bind(this);
    this.autoLoopCentringOnClick = this.autoLoopCentringOnClick.bind(this);

    this.state = {
      options: {
        [QUEUE_STARTED]: [
          { text: 'Stop', class: 'btn-danger', action: props.stopQueue, key: 1 },
        ],
        [QUEUE_RUNNING]: [
          { text: 'Stop', class: 'btn-danger', action: props.stopQueue, key: 1 },
        ],
        [QUEUE_STOPPED]: [
          { text: 'Run Queue', class: 'btn-success', action: props.runQueue, key: 1 },
        ],
        [QUEUE_PAUSED]: [
          { text: 'Stop', class: 'btn-danger', action: props.stopQueue, key: 1 },
        ]
      }
    };

    this.sampleState = {
      options: {
        [QUEUE_STARTED]: [
          { text: 'Pause', class: 'btn-warning', action: this.props.pause, key: 2 },
        ],
        [QUEUE_RUNNING]: [
          { text: 'Pause', class: 'btn-warning', action: this.props.pause, key: 2 },
        ],
        [QUEUE_STOPPED]: [],
        [QUEUE_PAUSED]: [
          { text: 'Resume', class: 'btn-success', action: this.props.unpause, key: 2 }
        ],
        NoSampleMounted: [
          { text: 'New Sample', class: 'btn-primary', action: this.showForm, key: 1 },
        ],
        LastSample: [
          { text: 'Finish', class: 'btn-primary', action: this.nextSample, key: 1 },
        ]
      }
    };
  }

  setAutoAddDiffPlan(e) {
    this.props.setAutoAddDiffPlan(e.target.checked);
  }

  nextSample() {
    const idx = this.props.queue.indexOf(this.props.mounted);
    this.props.setEnabledSample([this.props.queue[idx]], false);

    if (this.props.queue[idx + 1]) {
      this.props.runSample(this.props.queue[idx + 1]);
    } else {
      this.props.sendUnmountSample(this.props.sampleList[this.props.queue[idx]]);
    }
  }

  autoMountNextOnClick(e) {
    this.props.setAutoMountSample(e.target.checked);
  }

  autoLoopCentringOnClick(e) {
    if (e.target.checked) {
      this.props.sendSetCentringMethod(AUTO_LOOP_CENTRING);
    } else {
      this.props.sendSetCentringMethod(CLICK_CENTRING);
    }
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
    const idx = this.props.queue.indexOf(this.props.mounted);
    let nextSample = [];

    if (this.props.queue[idx + 1]) {
      const sampleData = this.props.sampleList[this.props.queue[idx + 1]];
      const sampleName = sampleData.sampleName ? sampleData.sampleName : '';
      const proteinAcronym = sampleData.proteinAcronym ? `${sampleData.proteinAcronym} - ` : '';

      nextSample = [{ text: `Next Sample (${proteinAcronym}${sampleName})`,
                      class: 'btn-default',
                      action: this.nextSample,
                      key: 2 }];
    }

    this.sampleState.options[QUEUE_STOPPED] = nextSample;

    const sampleId = this.props.mounted;
    const queueOptions = this.state.options[this.props.queueStatus];
    let sampleQueueOptions = [];

    if (sampleId) {
      if (this.props.queue.length === (idx + 1) && this.props.queueStatus === QUEUE_STOPPED) {
        sampleQueueOptions = this.sampleState.options.LastSample;
      } else {
        sampleQueueOptions = this.sampleState.options[this.props.queueStatus];
      }
    }

    return (
      <div className="m-tree">
        <div className="list-head">
          <div className="pull-left">
            <span style={{ marginRight: '0.6em' }}>
              {queueOptions.map((option) => this.renderOptions(option))}
            </span>
            <span>
              {sampleQueueOptions.map((option) => this.renderSampleOptions(option))}
            </span>
          </div>
          <div className="queue-settings pull-right">
            <DropdownButton
              className="test"
              bsStyle="default"
              title={(<span><i className="fa fa-1x fa-cog" /> Settings</span>)}
              key={1}
              id={`dropdown-basic-${1}`}
            >
              <li role="presentation">
                <span role="menuitem">
                  <Checkbox
                    name="autoMountNext"
                    onClick={this.autoMountNextOnClick}
                    defaultChecked={this.props.autoMountNext}
                  >
                    Automount next sample
                  </Checkbox>
                </span>
              </li>
              <li role="presentation">
                <span role="menuitem">
                  <Checkbox
                    onClick={this.autoLoopCentringOnClick}
                    name="autoLoopCentring"
                    defaultChecked={this.props.centringMethod === AUTO_LOOP_CENTRING}
                  >
                    Auto loop centring
                  </Checkbox>
                </span>
              </li>
              <li role="presentation">
                <span role="menuitem">
                  <Checkbox
                    name="autoAddDiffPlan"
                    onClick={this.setAutoAddDiffPlan}
                    defaultChecked={this.props.autoAddDiffPlan}
                  >
                  Auto add diffraction plan
                  </Checkbox>
                </span>
              </li>
              <li role="separator" className="divider"></li>
              <li role="presentation">
                <span role="menuitem">
                  <NumSnapshotsDropDown />
                </span>
              </li>
              <li role="separator" className="divider"></li>
              <li role="presentation">
                <span role="menuitem">
                  <GroupFolderInput />
                </span>
              </li>
            </DropdownButton>
          </div>
        </div>
      </div>
    );
  }
}
