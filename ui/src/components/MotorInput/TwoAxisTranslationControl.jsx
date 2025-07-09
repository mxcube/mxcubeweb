import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setAttribute } from '../../actions/beamline';
import { HW_STATE, QUEUE_RUNNING } from '../../constants';
import MotorInput from './MotorInput';
import styles from './TwoAxisTranslationControl.module.css';

function TwoAxisTranslationControl(props) {
  const { verticalMotorProps, horizontalMotorProps } = props;
  const dispatch = useDispatch();

  const verticalMotor = useSelector(
    (state) => state.beamline.hardwareObjects[verticalMotorProps.attribute],
  );
  const horizontalMotor = useSelector(
    (state) => state.beamline.hardwareObjects[horizontalMotorProps.attribute],
  );

  const motorsDisabled = useSelector(
    (state) =>
      state.beamline.motorInputDisable ||
      state.queue.queueStatus === QUEUE_RUNNING,
  );

  return (
    <div className={styles.root}>
      <Button
        className={styles.btn}
        aria-label="Move up"
        variant="outline-secondary"
        onClick={() =>
          dispatch(
            setAttribute(
              verticalMotorProps.attribute,
              verticalMotor.value + verticalMotorProps.step,
            ),
          )
        }
        disabled={motorsDisabled || verticalMotor.state !== HW_STATE.READY}
      >
        <i className={`${styles.btnIcon} fas fa-angle-up`} />
      </Button>
      <Button
        className={styles.btn}
        aria-label="Move left"
        variant="outline-secondary"
        disabled={motorsDisabled || horizontalMotor.state !== HW_STATE.READY}
        onClick={() =>
          dispatch(
            setAttribute(
              horizontalMotorProps.attribute,
              horizontalMotor.value - horizontalMotorProps.step,
            ),
          )
        }
      >
        <i className={`${styles.btnIcon} fas fa-angle-left`} />
      </Button>

      <OverlayTrigger
        trigger="click"
        rootClose
        placement="right"
        overlay={
          <Popover>
            <Popover.Header as="h3">Sample alignment motors</Popover.Header>
            <Popover.Body>
              <MotorInput
                role="sample_vertical"
                idPrefix="TwoAxisTranslationControl"
              />
              <MotorInput
                role="sample_horizontal"
                idPrefix="TwoAxisTranslationControl"
              />
            </Popover.Body>
          </Popover>
        }
      >
        <Button
          className={styles.btn}
          aria-label="Show sample alignment motors"
          variant="outline-secondary"
        >
          <i className={`${styles.btnIcon} fas fa-cog`} />
        </Button>
      </OverlayTrigger>

      <Button
        className={styles.btn}
        aria-label="Move right"
        variant="outline-secondary"
        disabled={motorsDisabled || horizontalMotor.state !== HW_STATE.READY}
        onClick={() =>
          dispatch(
            setAttribute(
              horizontalMotorProps.attribute,
              horizontalMotor.value + horizontalMotorProps.step,
            ),
          )
        }
      >
        <i className={`${styles.btnIcon} fas fa-angle-right`} />
      </Button>
      <Button
        className={styles.btn}
        aria-label="Move down"
        variant="outline-secondary"
        disabled={motorsDisabled || verticalMotor.state !== HW_STATE.READY}
        onClick={() =>
          dispatch(
            setAttribute(
              verticalMotorProps.attribute,
              verticalMotor.value - verticalMotorProps.step,
            ),
          )
        }
      >
        <i className={`${styles.btnIcon} fas fa-angle-down`} />
      </Button>
    </div>
  );
}

export default TwoAxisTranslationControl;
