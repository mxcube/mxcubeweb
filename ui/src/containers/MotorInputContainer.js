import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as sampleViewActions from '../actions/sampleview'; // eslint-disable-line import/no-namespace
import * as generalActions from '../actions/general'; // eslint-disable-line import/no-namespace
import * as beamlineActions from '../actions/beamline'; // eslint-disable-line import/no-namespace
import { QUEUE_RUNNING } from '../constants';

import MotorInput from '../components/MotorInput/MotorInput';

class MotorInputContainer extends Component {
  render() {
    const { uiprop } = this.props;
    const { motorhwo } = this.props;
    let result = null;

    if (!Number.isNaN(motorhwo.value)) {
      result = (
        <div>
          <MotorInput
            save={this.props.beamlineActions.sendSetAttribute}
            saveStep={this.props.sampleViewActions.setStepSize}
            step={uiprop.step}
            value={motorhwo.value}
            motorName={uiprop.attribute}
            label={`${uiprop.label}:`}
            suffix={uiprop.suffix}
            decimalPoints={uiprop.precision}
            state={motorhwo.state}
            stop={this.props.beamlineActions.sendAbortCurrentAction}
            disabled={this.props.motorInputDisabled}
          />
        </div>
      );
    }

    return result;
  }
}

function mapStateToProps(state, ownProps) {
  const { component, role } = ownProps;
  const uiprop = state.uiproperties[component].components.find(
    (el) => el.role === role,
  );

  const motorhwo = state.beamline.hardwareObjects[uiprop.attribute];

  return {
    value: motorhwo.value,
    state: motorhwo.state,
    motorhwo,
    uiprop,
    motorInputDisabled:
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sampleViewActions: bindActionCreators(sampleViewActions, dispatch),
    beamlineActions: bindActionCreators(beamlineActions, dispatch),
    generalActions: bindActionCreators(generalActions, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MotorInputContainer);
