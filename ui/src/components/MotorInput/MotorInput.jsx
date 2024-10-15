/* eslint-disable jsx-a11y/control-has-associated-label */

import React from 'react';
import { Button } from 'react-bootstrap';
import { HW_STATE } from '../../constants';
import styles from './MotorInput.module.css';
import './motor.css';
import BaseMotorInput from './BaseMotorInput';

function MotorInput(props) {
  const {
    label,
    value,
    motorName,
    step,
    state,
    suffix,
    precision,
    disabled,
    save,
    stop,
    saveStep,
  } = props;

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
              disabled={state !== HW_STATE.READY || disabled}
              onClick={() => save(motorName, value + step)}
            >
              <i aria-hidden="true" className="rw-i fas fa-caret-up" />
            </button>
            <button
              type="button"
              className="rw-btn"
              disabled={state !== HW_STATE.READY || disabled}
              onClick={() => save(motorName, value - step)}
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
            testId={`MotorInput_value_${motorName}`}
            disabled={disabled}
            onChange={(val) => save(motorName, val)}
          />
        </div>
        {saveStep &&
          (state === HW_STATE.READY ? (
            <>
              <input
                className={styles.stepInput}
                type="number"
                defaultValue={step}
                disabled={disabled}
                onChange={(evt) => saveStep(Number(evt.target.value))}
              />
              <span className={styles.unit}>{suffix}</span>
            </>
          ) : (
            <Button
              className="btn-xs motor-abort rw-widget-no-left-border"
              variant="danger"
              onClick={() => stop(motorName)}
            >
              <i className="fas fa-times" />
            </Button>
          ))}
      </div>
    </div>
  );
}

export default MotorInput;
