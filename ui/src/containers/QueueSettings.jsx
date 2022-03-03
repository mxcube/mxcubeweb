import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Checkbox, DropdownButton } from 'react-bootstrap';

import { AUTO_LOOP_CENTRING, CLICK_CENTRING } from '../constants';

import GroupFolderInput from './GroupFolderInput.jsx';
import NumSnapshotsDropDown from './NumSnapshotsDropDown.jsx';

import * as QueueActions from '../actions/queue';

class QueueSettings extends React.Component {
  constructor(props) {
    super(props);
    this.inputOnChangeHandler = this.inputOnChangeHandler.bind(this);
    this.setGroupFolderInput = this.setGroupFolderInput.bind(this);
    this.autoMountNextOnClick = this.autoMountNextOnClick.bind(this);
    this.setAutoAddDiffPlan = this.setAutoAddDiffPlan.bind(this);
    this.autoLoopCentringOnClick = this.autoLoopCentringOnClick.bind(this);

    this.inputValue = '';
    this.state = { validationState: 'success' };
  }

  setGroupFolderInput() {
     
    this.setState({ validationState: 'success' });
    /* eslint-enable react/no-set-state */
    this.props.queueActions.sendSetGroupFolder(this.inputValue.value);
  }

  setAutoAddDiffPlan(e) {
    this.props.queueActions.setAutoAddDiffPlan(e.target.checked);
  }

  inputOnChangeHandler() {
     
    this.setState({ validationState: 'warning' });
    /* eslint-enable react/no-set-state */
  }

  autoMountNextOnClick(e) {
    this.props.queueActions.setAutoMountSample(e.target.checked);
  }

  inputOnSelectHandler(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  }

  autoLoopCentringOnClick(e) {
    if (e.target.checked) {
      this.props.queueActions.sendSetCentringMethod(AUTO_LOOP_CENTRING);
    } else {
      this.props.queueActions.sendSetCentringMethod(CLICK_CENTRING);
    }
  }

  render() {
    return (
      <div className="queue-settings pull-right">
        <DropdownButton
          className="test"
          bsStyle="default"
          title={
            <span>
              <i className="fas fa-1x fa-cog" /> Settings
            </span>
          }
          key={1}
          id={`dropdown-basic-${1}`}
        >
          <li role="presentation">
            <span role="menuitem">
              <Checkbox
                name="autoMountNext"
                onChange={this.autoMountNextOnClick}
                checked={this.props.queueState.autoMountNext}
              >
                Automount next sample
              </Checkbox>
            </span>
          </li>
          <li role="presentation">
            <span role="menuitem">
              <Checkbox
                onChange={this.autoLoopCentringOnClick}
                name="autoLoopCentring"
                checked={
                  this.props.queueState.centringMethod === AUTO_LOOP_CENTRING
                }
              >
                Auto loop centring
              </Checkbox>
            </span>
          </li>
          <li role="presentation">
            <span role="menuitem">
              <Checkbox
                name="autoAddDiffPlan"
                onChange={this.setAutoAddDiffPlan}
                checked={this.props.queueState.autoAddDiffPlan}
              >
                Auto add diffraction plan
              </Checkbox>
            </span>
          </li>
          <li role="separator" className="divider" />
          <li role="presentation">
            <span role="menuitem">
              <NumSnapshotsDropDown />
            </span>
          </li>
          <li role="separator" className="divider" />
          <li role="presentation">
            <span role="menuitem">
              <GroupFolderInput />
            </span>
          </li>
        </DropdownButton>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    queueState: state.queue,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    queueActions: bindActionCreators(QueueActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(QueueSettings);
