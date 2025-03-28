import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';

import BaseMotorInput from './BaseMotorInput';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import { setAttribute } from '../../actions/beamline';
import styles from './OneAxisTranslationControl.module.css';

function OneAxisTranslationControl(props) {
  const { attribute, step, precision } = props.motorProps;
  const dispatch = useDispatch();

  const motor = useSelector(
    (state) => state.beamline.hardwareObjects[attribute],
  );

  const motorsDisabled = useSelector(
    (state) =>
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  );

  const { value, state, limits } = motor;
  const disabled = motorsDisabled || state !== HW_STATE.READY;

  return (
    <div className={styles.root}>
      <Button
        className={styles.btn}
        variant="outline-secondary"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value - 10 * step))}
      >
        <i className={`${styles.btnIcon} fas fa-angle-double-left`} />
      </Button>
      <Button
        className={styles.btn}
        variant="outline-secondary"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value - step))}
      >
        <i className={`${styles.btnIcon} fas fa-angle-left`} />
      </Button>

      <BaseMotorInput
        className={styles.input}
        value={value}
        state={state}
        precision={precision}
        step={step}
        min={limits[0]}
        max={limits[1]}
        disabled={disabled}
        onChange={(val) => dispatch(setAttribute(attribute, val))}
      />

      <Button
        className={styles.btn}
        variant="outline-secondary"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value + step))}
      >
        <i className={`${styles.btnIcon} fas fa-angle-right`} />
      </Button>
      <Button
        className={styles.btn}
        variant="outline-secondary"
        disabled={disabled}
        onClick={() => dispatch(setAttribute(attribute, value + 10 * step))}
      >
        <i className={`${styles.btnIcon} fas fa-angle-double-right`} />
      </Button>
    </div>
  );
}

export default OneAxisTranslationControl;
