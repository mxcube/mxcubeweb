import React, { useEffect, useRef } from 'react';
import { Button, ButtonToolbar, Form } from 'react-bootstrap';
import { TiTick, TiTimes } from 'react-icons/ti';

import styles from './BeamlineAttribute.module.css';

function BeamlineAttributeForm(props) {
  const { value, isBusy, step, precision, onSave, onCancel } = props;
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isBusy) {
      setTimeout(() => {
        /* Focus and select text when popover opens and every time a value is applied.
         * Timeout ensures this works when opening a popover while another is already opened. */
        inputRef.current?.focus({ preventScroll: true });
        inputRef.current?.select();
      }, 0);
    }
  }, [isBusy]);

  function handleSubmit(evt) {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const strVal = formData.get('value');

    const numVal =
      typeof strVal === 'string' ? Number.parseFloat(strVal) : Number.NaN;

    if (!Number.isNaN(numVal)) {
      onSave(numVal);
    }
  }

  return (
    <Form className="d-flex" noValidate onSubmit={handleSubmit}>
      <Form.Control
        ref={inputRef}
        className={styles.input}
        name="value"
        type="number"
        step={step}
        defaultValue={value.toFixed(precision)}
        disabled={isBusy}
        aria-label="Value"
      />
      <ButtonToolbar className="ms-1">
        {isBusy ? (
          <Button variant="danger" size="sm" onClick={() => onCancel()}>
            <TiTimes size="1.5em" />
          </Button>
        ) : (
          <Button type="submit" variant="success" size="sm">
            <TiTick size="1.5em" />
          </Button>
        )}
      </ButtonToolbar>
    </Form>
  );
}

export default BeamlineAttributeForm;
