/* eslint-disable jsx-a11y/control-has-associated-label */
import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setAttribute } from '../../actions/beamline';
import { stopBeamlineAction } from '../../actions/beamlineActions';
import { showErrorPanel } from '../../actions/general';
import { setMotorStep } from '../../actions/sampleview';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import BaseMotorInput from './BaseMotorInput';
import styles from './MotorInput.module.css';

function MotorInput(props) {
  const { role, idPrefix = 'MotorInput' } = props;
  const dispatch = useDispatch();

  const { attribute, label, precision, step, suffix } = useSelector((state) =>
    state.uiproperties.sample_view_motors.components.find(
      (el) => el.role === role,
    ),
  );

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

  if (Number.isNaN(motor.value)) {
    return null;
  }

  async function handleChange(val) {
    try {
      await dispatch(setAttribute(attribute, val));
    } catch (error) {
      dispatch(showErrorPanel(true, error.message));
    }
  }

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>

      <div className={styles.wrapper}>
        <BaseMotorInput
          min={motor.limits[0]}
          max={motor.limits[1]}
          id={id}
          className={styles.valueInput}
          value={value}
          state={state}
          precision={precision}
          step={step}
          disabled={disabled}
          onChange={handleChange}
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
                dispatch(setMotorStep(role, Number(evt.target.value)))
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
    </div>
  );
}

export default MotorInput;
