/* eslint-disable jsx-a11y/control-has-associated-label */
import { useEffect, useMemo, useState } from 'react';
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

function MotorInput(props) {
  const {role, idPrefix = 'MotorInput' } = props;
  const dispatch = useDispatch();

  const componentConfig = useSelector((state) =>
    state.uiproperties.sample_view_motors.components.find(
      (el) => el.role === role,
    ),
  );

  const { attribute, label, precision, step, suffix } = componentConfig;

  const [isEditingSliderValue, setIsEditingSliderValue] = useState(false);

  const availableVariants = useMemo(() => {
  const extraVariants = componentConfig?.variants || [];
  if (componentConfig?.variant) {
    extraVariants.push(componentConfig.variant);
  }
  if (extraVariants.length > 0) {
    return Array.from(new Set([...extraVariants, 'value']));
  }

  return ['value'];
}, [componentConfig?.variants, componentConfig?.variant]);

  const [activeVariant, setActiveVariant] = useState(() => {
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

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (availableVariants.length > 0 && activeVariant !== 'none' && !availableVariants.includes(activeVariant)) {
      setActiveVariant(availableVariants[0]);
    }
  }, [availableVariants, activeVariant]);

  if (Number.isNaN(motor.value)) {
    return null;
  }

  async function handleChange(val) {
    try {
      await dispatch(setAttribute(attribute, val));
      setIsChanging(false);
    } catch (error) {
      dispatch(showErrorPanel(true, error.message));
    }
  }

  function handleSliderChange(evt) {
    setIsChanging(true);
    setLocalValue(Number(evt.target.value));
  }

  const getVariantLabel = (variantKey) => {
    switch (variantKey) {
      case 'value':
        return 'Value';
      case 'slider':
        return 'Slider';
      case 'dial':
        return 'Dial';
      default:
        return variantKey;
    }
  };

  return (
    <div className={styles.container} data-variant={activeVariant} data-testid={id}>
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
            onChange={(e) => setActiveVariant(e.target.value)}
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
            className={styles.sliderInput}
            min={motor.limits[0]}
            max={motor.limits[1]}
            step={1}
            value={localValue ?? value}
            disabled={!isReady || disabled}
            onChange={handleSliderChange}
            onPointerUp={() => handleChange(localValue) && setLocalValue(null)}
          />
          <div className={styles.sliderLabels}>
            <span>{motor.limits[0]}</span>
            {isEditingSliderValue ? (
        <Form.Control
          size="sm"
          type="number"
          className={styles.sliderInputEdit}
          style={{ width: '80px', textAlign: 'center', padding: '0 4px' }}
          autoFocus
          defaultValue={Number(localValue ?? value).toFixed(precision)}
          disabled={!isReady || disabled}
          onBlur={(e) => {
            const val = Number(e.target.value);
            if (!Number.isNaN(val)) {
              handleChange(val);
            }
            setIsEditingSliderValue(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = Number(e.target.value);
              if (!Number.isNaN(val)) {
                handleChange(val);
              }
              setIsEditingSliderValue(false);
            } else if (e.key === 'Escape') {
              setIsEditingSliderValue(false);
            }
          }}
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={styles.sliderValue}
          style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
          onClick={() => !disabled && isReady && setIsEditingSliderValue(true)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && isReady) {
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

      {(activeVariant === 'dial') && (
        <AngleIndicator
          angle={localValue ?? value}
          disabled={!isReady || disabled}
          onChange={(newAngle) => {
            setIsChanging(true);
            setLocalValue(newAngle);
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