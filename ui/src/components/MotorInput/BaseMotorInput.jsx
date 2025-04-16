/* eslint-disable jsx-a11y/control-has-associated-label */
import { useEffect, useState } from 'react';

import { HW_STATE } from '../../constants';

function BaseMotorInput(props) {
  const {
    id,
    className,
    value,
    state,
    precision,
    step,
    min,
    max,
    disabled,
    onChange,
  } = props;

  const [inputValue, setInputValue] = useState(value.toFixed(precision));
  const [isEdited, setEdited] = useState(false);

  useEffect(() => {
    setInputValue(value.toFixed(precision));
    setEdited(false);
  }, [value, precision, state]); // `state` to re-apply `precision` in case `value` doesn't change

  function handleKey(evt) {
    switch (evt.key) {
      case 'ArrowUp': {
        evt.preventDefault();
        onChange(value + step);
        break;
      }
      case 'ArrowDown': {
        evt.preventDefault();
        onChange(value - step);
        break;
      }
      default:
    }
  }

  function handleSubmit(evt) {
    evt.preventDefault();

    const newValue = Number.parseFloat(inputValue);

    if (!Number.isNaN(newValue)) {
      onChange(newValue);
      setEdited(false);
    }
  }

  const isReady = state === HW_STATE.READY;
  const isBusy = state === HW_STATE.BUSY;
  const isWarning = state === HW_STATE.WARNING;
  const isFault =
    state === HW_STATE.UNKNOWN ||
    state === HW_STATE.FAULT ||
    state === HW_STATE.OFF;

  return (
    <form className="d-flex" noValidate onSubmit={handleSubmit}>
      <input
        id={id}
        className={className}
        type="number"
        value={inputValue}
        step={step}
        max={max}
        min={min}
        disabled={disabled || !isReady}
        data-dirty={isEdited || undefined}
        data-busy={isBusy || undefined}
        data-warning={isWarning || undefined}
        data-fault={isFault || undefined}
        onKeyDown={handleKey}
        onChange={(evt) => {
          setInputValue(evt.target.value);
          setEdited(true);
        }}
      />
      <input type="submit" hidden /> {/* allow submit on Enter */}
    </form>
  );
}

export default BaseMotorInput;
