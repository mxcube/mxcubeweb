/* eslint-disable jsx-a11y/control-has-associated-label */
import { useMemo, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setAttribute } from '../../actions/beamline';
import { stopBeamlineAction } from '../../actions/beamlineActions';
import { showErrorPanel } from '../../actions/general';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import { setMotorStep } from '../../reducers/uiproperties';
import AngleIndicator from './AngleIndicator';
import BaseMotorInput from './BaseMotorInput';
import styles from './MotorInput.module.css';

function getVariantLabel(variantKey) {
  switch (variantKey) {
    case 'value': {
      return 'Value';
    }
    case 'slider': {
      return 'Slider';
    }
    case 'dial': {
      return 'Dial';
    }
    default: {
      return variantKey;
    }
  }
}

function MotorInput(props) {
  const { role, idPrefix = 'MotorInput' } = props;
  const dispatch = useDispatch();

  const sliderRef = useRef(null);

  const componentConfig = useSelector((state) =>
    state.uiproperties.sample_view_motors.components.find(
      (el) => el.role === role,
    ),
  );

  const { attribute, label, precision, step, suffix } = componentConfig;

  const [isEditingSliderValue, setIsEditingSliderValue] = useState(false);

  const availableVariants = useMemo(() => {
    const extraVariants = componentConfig?.variants || [];

    if (extraVariants.length > 0) {
      return [...new Set([...extraVariants, 'value'])];
    }

    return ['value'];
  }, [componentConfig?.variants]);

  const [selectedVariant, setSelectedVariant] = useState(() => {
    return componentConfig?.variants?.[0] ?? 'value';
  });

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
  const id = `${idPrefix}_${role}`;

  const [localValue, setLocalValue] = useState(null);
  const [isChanging, setIsChanging] = useState(false);

  const activeVariant = availableVariants.includes(selectedVariant)
    ? selectedVariant
    : availableVariants[0];

  if (Number.isNaN(motor.value)) {
    return null;
  }

  async function handleChange(val) {
    try {
      await dispatch(setAttribute(attribute, val));
    } catch (error) {
      dispatch(showErrorPanel(true, error.message));
    } finally {
      setIsChanging(false);
    }
  }

  function handleLocalChange(evt) {
    setIsChanging(true);
    setLocalValue(Number(evt.target.value));
  }

  return (
    <div
      className={styles.container}
      data-variant={activeVariant}
      data-testid={id}
    >
      <div className="d-flex align-items-center justify-content-between mb-1">
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {availableVariants.length > 1 && (
          <Form.Select
            size="sm"
            className="w-auto py-0 ps-3 pe-6"
            style={{ fontSize: '0.75rem' }}
            value={activeVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
          >
            {availableVariants.map((v) => (
              <option key={v} value={v}>
                {getVariantLabel(v)}
              </option>
            ))}
          </Form.Select>
        )}
      </div>

      {activeVariant === 'value' && (
        <div className={styles.wrapper}>
          <BaseMotorInput
            min={motor.limits[0]}
            max={motor.limits[1]}
            id={id}
            className={styles.valueInput}
            value={localValue ?? value}
            state={state}
            precision={precision}
            step={step}
            disabled={disabled}
            onChange={handleChange}
            isChanging={isChanging}
          />

          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.arrowBtn}
              data-testid={`${id}_up`}
              disabled={!isReady || disabled}
              onClick={() => handleChange(value + step)}
            >
              <i aria-hidden="true" className="fas fa-caret-up" />
            </button>
            <button
              type="button"
              className={styles.arrowBtn}
              data-testid={`${id}_down`}
              disabled={!isReady || disabled}
              onClick={() => handleChange(value - step)}
            >
              <i aria-hidden="true" className="fas fa-caret-down" />
            </button>
          </div>

          {isReady ? (
            <>
              <input
                className={styles.stepInput}
                data-testid={`${id}_step`}
                type="number"
                defaultValue={step}
                disabled={disabled}
                onChange={(evt) =>
                  dispatch(
                    setMotorStep({ role, value: Number(evt.target.value) }),
                  )
                }
              />
              <span className={styles.unit}>{suffix}</span>
            </>
          ) : (
            <Button
              className={styles.abortBtn}
              variant="danger"
              onClick={() => dispatch(stopBeamlineAction(attribute))}
            >
              <i className="fas fa-times" />
            </Button>
          )}
        </div>
      )}

      {activeVariant === 'slider' && (
        <div className={styles.sliderContainer}>
          <Form.Range
            ref={sliderRef}
            className={styles.sliderInput}
            min={motor.limits[0]}
            max={motor.limits[1]}
            step={1}
            value={localValue ?? value}
            disabled={!isReady || disabled}
            onChange={handleLocalChange}
            onPointerUp={() => {
              handleChange(localValue);
              setLocalValue(null);
            }}
            onKeyUp={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const val = Number(e.target.value);
                if (!Number.isNaN(val)) {
                  handleChange(val);
                  setLocalValue(null);
                }
              }
            }}
          />
          <div className={styles.sliderLabels}>
            <span>{motor.limits[0]}</span>
            {isEditingSliderValue ? (
              <BaseMotorInput
                id={`${id}_slider_edit`}
                className={styles.sliderInputEdit}
                value={value}
                state={state}
                precision={precision}
                step={1}
                min={motor.limits[0]}
                max={motor.limits[1]}
                disabled={!isReady || disabled}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setLocalValue(null);
                    setIsEditingSliderValue(false);
                  }
                }}
                onBlur={() => {
                  setLocalValue(null);
                  setIsEditingSliderValue(false);
                }}
                onChange={(val) => {
                  handleChange(val);
                  setIsEditingSliderValue(false);
                }}
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                className={styles.sliderValue}
                style={{
                  cursor: 'pointer',
                  textDecoration: 'underline dotted',
                }}
                onClick={() =>
                  !disabled && isReady && setIsEditingSliderValue(true)
                }
                onBlur={() => {
                  setLocalValue(null);
                  setIsEditingSliderValue(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !disabled && isReady) {
                    setIsEditingSliderValue(true);
                  }
                }}
              >
                {Number(localValue ?? value).toFixed(precision)}
              </div>
            )}
            <span>{motor.limits[1]}</span>
          </div>
        </div>
      )}

      {activeVariant === 'dial' && (
        <AngleIndicator
          angle={localValue ?? value}
          disabled={!isReady || disabled}
          onChange={(Angle) => {
            setIsChanging(true);
            setLocalValue(Angle);
          }}
          onChangeEnd={(finalAngle) => {
            handleChange(finalAngle);
            setLocalValue(null);
          }}
        />
      )}
    </div>
  );
}

export default MotorInput;
