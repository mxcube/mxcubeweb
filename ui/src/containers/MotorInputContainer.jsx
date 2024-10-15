import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { QUEUE_RUNNING } from '../constants';

import MotorInput from '../components/MotorInput/MotorInput';
import { stopBeamlineAction } from '../actions/beamlineActions';
import { setAttribute } from '../actions/beamline';
import { setMotorStep } from '../actions/sampleview';

function MotorInputContainer(props) {
  const { component, role } = props;
  const dispatch = useDispatch();

  const motorProps = useSelector((state) =>
    state.uiproperties[component].components.find((el) => el.role === role),
  );

  const motor = useSelector(
    (state) => state.beamline.hardwareObjects[motorProps.attribute],
  );

  const motorDisabled = useSelector(
    (state) =>
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  );

  if (Number.isNaN(motor.value)) {
    return null;
  }

  return (
    <MotorInput
      save={(name, value) => dispatch(setAttribute(name, value))}
      saveStep={(value) => dispatch(setMotorStep(motorProps.role, value))}
      step={motorProps.step}
      value={motor.value}
      motorName={motorProps.attribute}
      label={`${motorProps.label}:`}
      suffix={motorProps.suffix}
      precision={motorProps.precision}
      state={motor.state}
      stop={(cmdName) => dispatch(stopBeamlineAction(cmdName))}
      disabled={motorDisabled}
    />
  );
}

export default MotorInputContainer;
