import React, { useRef } from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

import { STATE } from '../../actions/beamline';
import BeamlineAttributeForm from './BeamlineAttributeForm';
import styles from './BeamlineAttribute.module.css';
import '../input.css';

const STATE_CLASS = {
  [STATE.BUSY]: 'input-bg-moving',
  [STATE.ABORT]: 'input-bg-fault',
};

function BeamlineAttribute(props) {
  const { attribute, format, precision = 1, suffix, onSave, onCancel } = props;
  const {
    state = STATE.IDLE,
    value = 0,
    step = 0.1,
    msg,
    readonly = false,
  } = attribute;

  const btnRef = useRef(null);

  const valStr = value
    ? format === 'expo'
      ? value.toExponential(precision)
      : value.toFixed(precision)
    : '-';

  if (readonly) {
    return (
      <span className={styles.value}>
        {valStr}
        {suffix && ` ${suffix}`}
      </span>
    );
  }

  return (
    <OverlayTrigger
      rootClose
      trigger="click"
      placement="right"
      onToggle={(show) => {
        if (!show) {
          // Bring focus back on button when popover closes
          btnRef.current?.focus({ preventScroll: true });
        }
      }}
      overlay={
        <Popover
          id="beamline-attribute-popover"
          className="d-flex align-items-center p-2"
        >
          <BeamlineAttributeForm
            value={value}
            isBusy={state === STATE.BUSY}
            step={step}
            precision={precision}
            onSave={onSave}
            onCancel={onCancel}
          />
          {msg && <div className="mx-3">{msg}</div>}
        </Popover>
      }
    >
      <Button
        ref={btnRef}
        className={`${styles.valueBtn} ${STATE_CLASS[state] || ''}`}
        variant="link"
        data-default-styles
      >
        {valStr}
        {suffix && ` ${suffix}`}
      </Button>
    </OverlayTrigger>
  );
}

export default BeamlineAttribute;
