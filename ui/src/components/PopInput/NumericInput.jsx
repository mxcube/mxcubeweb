import React, { useState } from 'react';
import { Form, Button, ButtonToolbar } from 'react-bootstrap';
import RcInputNumber from 'rc-input-number';
import { TiTick, TiTimes } from 'react-icons/ti';

function NumericInput(props) {
  const { initialValue, precision, step, size, busy, onCancel, onSubmit } =
    props;

  const [value, setValue] = useState(initialValue);

  function handleSubmit(evt) {
    evt.preventDefault();

    if (!busy) {
      onSubmit(value);
    }
  }

  return (
    <Form className="popinput-form" onSubmit={handleSubmit} noValidate>
      <RcInputNumber
        name="value"
        className="popinput-input"
        precision={precision}
        step={step}
        size={size}
        disabled={busy}
        upHandler={<i aria-hidden="true" className="fas fa-caret-up" />}
        downHandler={<i aria-hidden="true" className="fas fa-caret-down" />}
        value={value}
        onChange={(nextValue) => {
          // Discard invalid values (i.e. "", "NaN", etc.)
          if (nextValue !== null) {
            setValue(nextValue);
          }
        }}
      />
      <ButtonToolbar className="ms-1">
        {busy ? (
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

NumericInput.defaultProps = {
  initialValue: 0,
  precision: 3,
  step: 0.1,
  size: 5,
  busy: false,
  onCancel: undefined,
  onSubmit: undefined,
};

export default NumericInput;
