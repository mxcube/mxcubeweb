import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { QUEUE_RUNNING } from '../constants';

import MotorInput from '../components/MotorInput/MotorInput';
import { stopBeamlineAction } from '../actions/beamlineActions';
import { setAttribute } from '../actions/beamline';
import { setStepSize } from '../actions/sampleview';

class MotorInputContainer extends Component {
  render() {
    const { uiprop } = this.props;
    const { motorhwo } = this.props;
    let result = null;

    if (!Number.isNaN(motorhwo.value)) {
      result = (
        <div>
          <MotorInput
            save={this.props.setAttribute}
            saveStep={this.props.setStepSize}
            step={uiprop.step}
            value={motorhwo.value}
            motorName={uiprop.attribute}
            label={`${uiprop.label}:`}
            suffix={uiprop.suffix}
            decimalPoints={uiprop.precision}
            state={motorhwo.state}
            stop={this.props.stopBeamlineAction}
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
    stopBeamlineAction: bindActionCreators(stopBeamlineAction, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
    setStepSize: bindActionCreators(setStepSize, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MotorInputContainer);
