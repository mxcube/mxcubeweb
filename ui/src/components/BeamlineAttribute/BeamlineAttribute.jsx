import { useRef } from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

import { HW_STATE } from '../../constants';
import styles from './BeamlineAttribute.module.css';
import BeamlineAttributeForm from './BeamlineAttributeForm';

function BeamlineAttribute(props) {
  const { attribute, format, precision = 1, suffix, onSave, onCancel } = props;
  const { state, value = 0, step = 0.1, msg, readonly = false } = attribute;

  const isBusy = state === HW_STATE.BUSY;

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
            isBusy={isBusy}
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
        className={styles.valueBtn}
        variant="link"
        data-busy={isBusy || undefined}
        data-default-styles
      >
        {valStr}
        {suffix && ` ${suffix}`}
      </Button>
    </OverlayTrigger>
  );
}

export default BeamlineAttribute;
