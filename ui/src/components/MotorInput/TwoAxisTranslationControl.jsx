import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import MotorInput from './MotorInput';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import { setAttribute } from '../../actions/beamline';
import './motor.css';

function TwoAxisTranslationControl(props) {
  const { verticalMotorProps, horizontalMotorProps } = props;
  const dispatch = useDispatch();

  const verticalMotor = useSelector(
    (state) => state.beamline.hardwareObjects[verticalMotorProps.attribute],
  );
  const horizontalMotor = useSelector(
    (state) => state.beamline.hardwareObjects[horizontalMotorProps.attribute],
  );

  const motorsDisabled = useSelector(
    (state) =>
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  );

  return (
    <div className="arrow-control mb-3">
      <p className="motor-name mb-2">Sample alignment</p>

      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() =>
          dispatch(
            setAttribute(
              verticalMotorProps.attribute,
              verticalMotor.value + verticalMotorProps.step,
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
              horizontalMotor.value - horizontalMotorProps.step,
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
              <MotorInput role="sample_vertical" />
              <MotorInput role="sample_horizontal" />
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
              horizontalMotor.value + horizontalMotorProps.step,
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
              verticalMotor.value - verticalMotorProps.step,
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
