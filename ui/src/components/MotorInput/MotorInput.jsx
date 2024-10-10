/* eslint-disable jsx-a11y/control-has-associated-label */

import React, { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { HW_STATE } from '../../constants';
import styles from './MotorInput.module.css';
import './motor.css';

function MotorInput(props) {
  const {
    label,
    value,
    motorName,
    step,
    state,
    suffix,
    decimalPoints,
    disabled,
    save,
    stop,
    saveStep,
  } = props;

  const [inputValue, setInputValue] = useState(value.toFixed(decimalPoints));
  const [isEdited, setEdited] = useState(false);

  useEffect(() => {
    setInputValue(value.toFixed(decimalPoints));
    setEdited(false);
  }, [value, decimalPoints]);

  function handleKey(evt) {
    switch (evt.key) {
      case 'ArrowUp': {
        evt.preventDefault();
        save(motorName, value + step);
        break;
      }
      case 'ArrowDown': {
        evt.preventDefault();
        save(motorName, value - step);
        break;
      }
      default:
    }
  }

  function handleSubmit(evt) {
    evt.preventDefault();

    const newValue = Number.parseFloat(inputValue);

    if (!Number.isNaN(newValue)) {
      save(motorName, newValue);
      setEdited(false);
    }
  }

  return (
    <div className="motor-input-container">
      <p className="motor-name">{label}</p>
      <div className={styles.wrapper}>
        <form noValidate onSubmit={handleSubmit}>
          <div
            className="rw-widget rw-numberpicker rw-widget-no-right-border"
            style={{ width: '90px', display: 'inline-block' }}
          >
            <span className="rw-select">
              <button
                type="button"
                className="rw-btn"
                disabled={state !== HW_STATE.READY || disabled}
                onClick={() => {
                  save(motorName, value + step);
                }}
              >
                <i aria-hidden="true" className="rw-i fas fa-caret-up" />
              </button>
              <button
                type="button"
                className="rw-btn"
                disabled={state !== HW_STATE.READY || disabled}
                onClick={() => {
                  save(motorName, value - step);
                }}
              >
                <i aria-hidden="true" className="rw-i fas fa-caret-down" />
              </button>
            </span>
            <Form.Control
              className={`${styles.valueInput} rw-input`}
              name="value"
              type="number"
              step={step}
              disabled={state !== HW_STATE.READY || disabled}
              data-dirty={isEdited || undefined}
              data-busy={state === HW_STATE.BUSY || undefined}
              data-warning={state === HW_STATE.WARNING || undefined}
              data-fault={
                state === HW_STATE.UNKNOWN ||
                state === HW_STATE.FAULT ||
                state === HW_STATE.OFF ||
                undefined
              }
              value={inputValue}
              onChange={(evt) => {
                setInputValue(evt.target.value);
                setEdited(true);
              }}
              onKeyDown={handleKey}
              data-testId={`MotorInput_value_${motorName}`}
            />
            <input type="submit" hidden /> {/* allow submit on Enter */}
          </div>
        </form>
        {saveStep &&
          (state === HW_STATE.READY ? (
            <>
              <input
                className={styles.stepInput}
                type="number"
                defaultValue={step}
                disabled={disabled}
                onChange={(evt) =>
                  saveStep(motorName.toLowerCase(), Number(evt.target.value))
                }
              />
              <span className={styles.unit}>{suffix}</span>
            </>
          ) : (
            <Button
              className="btn-xs motor-abort rw-widget-no-left-border"
              variant="danger"
              onClick={() => {
                stop(motorName);
              }}
            >
              <i className="fas fa-times" />
            </Button>
          ))}
      </div>
    </div>
  );
}

export default MotorInput;
