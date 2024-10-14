import React from 'react';
import { Button } from 'react-bootstrap';

import BaseMotorInput from './BaseMotorInput';
import { HW_STATE } from '../../constants';
import './motor.css';
import styles from './OneAxisTranslationControl.module.css';

function OneAxisTranslationControl(props) {
  const { motorName, value, state, step, disabled, precision, min, max, save } =
    props;

  return (
    <div className={`${styles.root} arrow-control`}>
      <Button
        variant="outline-secondary"
        style={{ marginRight: '2px' }}
        className="arrow-small arrow-left"
        disabled={state !== HW_STATE.READY || disabled}
        onClick={() => save(motorName, value - 10 * step)}
      >
        <i className="fas fa-angle-double-left" />
      </Button>
      <Button
        variant="outline-secondary"
        className="arrow-small arrow-left"
        disabled={state !== HW_STATE.READY || disabled}
        onClick={() => save(motorName, value - step)}
      >
        <i className="fas fa-angle-left" />
      </Button>

      <BaseMotorInput
        className={`${styles.input} rw-input`}
        style={{
          width: `${Number.parseFloat(precision) + 2}em`,
          height: 'auto',
          display: 'inline-block',
          marginLeft: '5px',
          marginRight: '5px',
        }}
        value={value}
        state={state}
        precision={precision}
        step={step}
        max={max}
        min={min}
        testId={`MotorInput_value_${motorName}`}
        disabled={disabled}
        onChange={(val) => save(motorName, val)}
      />

      <Button
        variant="outline-secondary"
        className="arrow-small arrow-right"
        disabled={state !== HW_STATE.READY || disabled}
        onClick={() => save(motorName, value + step)}
      >
        <i className="fas fa-angle-right" />
      </Button>
      <Button
        variant="outline-secondary"
        style={{ marginLeft: '2px' }}
        className="arrow-small arrow-right"
        disabled={state !== HW_STATE.READY || disabled}
        onClick={() => save(motorName, value + 10 * step)}
      >
        <i className="fas fa-angle-double-right" />
      </Button>
    </div>
  );
}

export default OneAxisTranslationControl;
