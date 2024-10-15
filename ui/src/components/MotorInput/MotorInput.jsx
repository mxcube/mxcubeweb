/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';

import BaseMotorInput from './BaseMotorInput';
import { stopBeamlineAction } from '../../actions/beamlineActions';
import { setAttribute } from '../../actions/beamline';
import { setMotorStep } from '../../actions/sampleview';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import styles from './MotorInput.module.css';
import './motor.css';

function MotorInput(props) {
  const { role } = props;
  const dispatch = useDispatch();

  const { attribute, label, precision, step, suffix } = useSelector((state) =>
    state.uiproperties.sample_view.components.find((el) => el.role === role),
  );

  const motor = useSelector(
    (state) => state.beamline.hardwareObjects[attribute],
  );

  const disabled = useSelector(
    (state) =>
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  );

  const { state, value } = motor;
  const isReady = state === HW_STATE.READY;

  if (Number.isNaN(motor.value)) {
    return null;
  }

  return (
    <div className="motor-input-container">
      <p className="motor-name">{label}</p>
      <div className={styles.wrapper}>
        <div
          className="rw-widget rw-numberpicker rw-widget-no-right-border"
          style={{ width: '90px', display: 'inline-block' }}
        >
          <span className="rw-select">
            <button
              type="button"
              className="rw-btn"
              disabled={!isReady || disabled}
              onClick={() => dispatch(setAttribute(attribute, value + step))}
            >
              <i aria-hidden="true" className="rw-i fas fa-caret-up" />
            </button>
            <button
              type="button"
              className="rw-btn"
              disabled={!isReady || disabled}
              onClick={() => dispatch(setAttribute(attribute, value - step))}
            >
              <i aria-hidden="true" className="rw-i fas fa-caret-down" />
            </button>
          </span>

          <BaseMotorInput
            className={`${styles.valueInput} rw-input`}
            value={value}
            state={state}
            precision={precision}
            step={step}
            testId={`MotorInput_value_${attribute}`}
            disabled={disabled}
            onChange={(val) => dispatch(setAttribute(attribute, val))}
          />
        </div>

        {isReady ? (
          <>
            <input
              className={styles.stepInput}
              type="number"
              defaultValue={step}
              disabled={disabled}
              onChange={(evt) =>
                dispatch(setMotorStep(role, Number(evt.target.value)))
              }
            />
            <span className={styles.unit}>{suffix}</span>
          </>
        ) : (
          <Button
            className="btn-xs motor-abort rw-widget-no-left-border"
            variant="danger"
            onClick={() => dispatch(stopBeamlineAction(attribute))}
          >
            <i className="fas fa-times" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default MotorInput;
