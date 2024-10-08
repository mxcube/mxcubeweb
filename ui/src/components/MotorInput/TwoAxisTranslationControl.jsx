import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import MotorInput from './MotorInput';
import './motor.css';
import { useDispatch, useSelector } from 'react-redux';
import { setAttribute } from '../../actions/beamline';
import { setStepSize } from '../../actions/sampleview';
import { stopBeamlineAction } from '../../actions/beamlineActions';

function TwoAxisTranslationControl(props) {
  const { verticalMotorProps, horizontalMotorProps } = props;

  const dispatch = useDispatch();

  const verticalMotor = useSelector(
    (state) => state.beamline.hardwareObjects[verticalMotorProps.attribute],
  );
  const horizontalMotor = useSelector(
    (state) => state.beamline.hardwareObjects[horizontalMotorProps.attribute],
  );

  const { sample_verticalStep, sample_horizontalStep } = useSelector(
    (state) => state.sampleview.motorSteps,
  );

  const motorsDisabled = useSelector(
    (state) =>
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  );

  return (
    <div className="arrow-control mb-3">
      <p className="motor-name mb-2">Sample alignment:</p>

      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() =>
          dispatch(
            setAttribute(
              verticalMotorProps.attribute,
              verticalMotor.value + sample_verticalStep,
            ),
          )
        }
        disabled={motorsDisabled || verticalMotor.state !== HW_STATE.READY}
        className="arrow arrow-up"
      >
        <i className="fas fa-angle-up" />
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        className="arrow arrow-left"
        disabled={motorsDisabled || horizontalMotor.state !== HW_STATE.READY}
        onClick={() =>
          dispatch(
            setAttribute(
              horizontalMotorProps.attribute,
              horizontalMotor.value - sample_horizontalStep,
            ),
          )
        }
      >
        <i className="fas fa-angle-left" />
      </Button>
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="right"
        overlay={
          <Popover>
            <Popover.Header as="h3">Sample alignment motors</Popover.Header>
            <Popover.Body>
              <MotorInput
                save={(name, val) => dispatch(setAttribute(name, val))}
                value={verticalMotor.value}
                saveStep={(name, val) => dispatch(setStepSize(name, val))}
                step={verticalMotorProps.step}
                motorName={verticalMotorProps.attribute}
                label={verticalMotorProps.label}
                suffix={verticalMotorProps.suffix}
                decimalPoints={verticalMotorProps.precision}
                state={verticalMotor.state}
                stop={(cmdName) => dispatch(stopBeamlineAction(cmdName))}
                disabled={motorsDisabled}
                inplace
              />
              <MotorInput
                save={(name, val) => dispatch(setAttribute(name, val))}
                value={horizontalMotor.value}
                saveStep={(name, val) => dispatch(setStepSize(name, val))}
                step={horizontalMotorProps.step}
                motorName={horizontalMotorProps.attribute}
                label={horizontalMotorProps.label}
                suffix={horizontalMotorProps.suffix}
                decimalPoints={horizontalMotorProps.precision}
                state={horizontalMotor.state}
                stop={(cmdName) => dispatch(stopBeamlineAction(cmdName))}
                disabled={motorsDisabled}
                inplace
              />
            </Popover.Body>
          </Popover>
        }
      >
        <Button
          size="sm"
          variant="outline-secondary"
          className="arrow arrow-settings"
        >
          <i className="fas fa-cog" />
        </Button>
      </OverlayTrigger>
      <Button
        size="sm"
        variant="outline-secondary"
        className="arrow arrow-right"
        disabled={motorsDisabled || horizontalMotor.state !== HW_STATE.READY}
        onClick={() =>
          dispatch(
            setAttribute(
              horizontalMotorProps.attribute,
              horizontalMotor.value + sample_horizontalStep,
            ),
          )
        }
      >
        <i className="fas fa-angle-right" />
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        className="arrow arrow-down"
        disabled={motorsDisabled || verticalMotor.state !== HW_STATE.READY}
        onClick={() =>
          dispatch(
            setAttribute(
              verticalMotorProps.attribute,
              verticalMotor.value - sample_verticalStep,
            ),
          )
        }
      >
        <i className="fas fa-angle-down" />
      </Button>
    </div>
  );
}

export default TwoAxisTranslationControl;
