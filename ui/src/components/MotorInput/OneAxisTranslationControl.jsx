import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';

import BaseMotorInput from './BaseMotorInput';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import { setAttribute } from '../../actions/beamline';

import './motor.css';
import styles from './OneAxisTranslationControl.module.css';

function OneAxisTranslationControl(props) {
  const { attribute, step, precision } = props.motorProps;
  const dispatch = useDispatch();

  const motor = useSelector(
    (state) => state.beamline.hardwareObjects[attribute],
  );

  const motorsDisabled = useSelector(
    (state) =>
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  );

  const { value, state, limits } = motor;
  const disabled = motorsDisabled || state !== HW_STATE.READY;

  return (
    <div className={`${styles.root} arrow-control`}>
      <Button
        variant="outline-secondary"
        style={{ marginRight: '2px' }}
        className="arrow-small arrow-left"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value - 10 * step))}
      >
        <i className="fas fa-angle-double-left" />
      </Button>
      <Button
        variant="outline-secondary"
        className="arrow-small arrow-left"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value - step))}
      >
        <i className="fas fa-angle-left" />
      </Button>

      <BaseMotorInput
        className={`${styles.input} rw-input`}
        style={{
          width: `${precision + 2}em`,
          height: 'auto',
          display: 'inline-block',
          marginLeft: '5px',
          marginRight: '5px',
        }}
        value={value}
        state={state}
        precision={precision}
        step={step}
        min={limits[0]}
        max={limits[1]}
        testId={`MotorInput_value_${attribute}`}
        disabled={disabled}
        onChange={(val) => dispatch(setAttribute(attribute, val))}
      />

      <Button
        variant="outline-secondary"
        className="arrow-small arrow-right"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value + step))}
      >
        <i className="fas fa-angle-right" />
      </Button>
      <Button
        variant="outline-secondary"
        style={{ marginLeft: '2px' }}
        className="arrow-small arrow-right"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value + 10 * step))}
      >
        <i className="fas fa-angle-double-right" />
      </Button>
    </div>
  );
}

export default OneAxisTranslationControl;
