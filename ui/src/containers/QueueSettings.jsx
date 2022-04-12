import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Form, DropdownButton, Dropdown } from 'react-bootstrap';

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
    /* eslint-disable react/no-set-state */
    this.setState({ validationState: 'success' });
    /* eslint-enable react/no-set-state */
    this.props.queueActions.sendSetGroupFolder(this.inputValue.value);
  }

  setAutoAddDiffPlan(e) {
    this.props.queueActions.setAutoAddDiffPlan(e.target.checked);
  }

  inputOnChangeHandler() {
    /* eslint-disable react/no-set-state */
    this.setState({ validationState: 'warning' });
    /* eslint-enable react/no-set-state */
  }

  autoMountNextOnClick(e) {
    e.preventDefault()
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
          <Dropdown
            className="queue-settings"
            autoClose="outside"
          >
            <Dropdown.Toggle
              variant="outline-secondary"
            >
              <span><i className="fas fa-1x fa-cog" /> Settings</span>
            </Dropdown.Toggle>
            <Dropdown.Menu
              // variant="dark"
            >
              <Dropdown.Item>
                <Form.Check
                  type="checkbox"
                  name="autoMountNext"
                  onChange={this.autoMountNextOnClick}
                  checked={this.props.queueState.autoMountNext}
                  label="Automount next sample"
                />
              </Dropdown.Item>
              <Dropdown.Item>
                <Form.Check
                  type="checkbox"
                  onChange={this.autoLoopCentringOnClick}
                  name="autoLoopCentring"
                  checked={this.props.queueState.centringMethod === AUTO_LOOP_CENTRING}
                  label="Auto loop centring"
                />
              </Dropdown.Item>
              <Dropdown.Item>
                <Form.Check
                  type="checkbox"
                  name="autoAddDiffPlan"
                  onChange={this.setAutoAddDiffPlan}
                  checked={this.props.queueState.autoAddDiffPlan}
                  label="Auto add diffraction plan"
                />
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item>
                <NumSnapshotsDropDown />
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item>
                <GroupFolderInput />
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
    );
  }
}

function mapStateToProps(state) {
  return {
    queueState: state.queue
  };
}

function mapDispatchToProps(dispatch) {
  return {
    queueActions: bindActionCreators(QueueActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(QueueSettings);

