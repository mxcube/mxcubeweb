import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setAttribute } from '../../actions/beamline';
import { HW_STATE } from '../../constants';
import styles from './SampleControls.module.css';

function LightControl(props) {
  const { label, hwoId } = props;
  const dispatch = useDispatch();

  const light = useSelector((state) => state.beamline.hardwareObjects[hwoId]);

  const lightSwitch = useSelector(
    (state) => state.beamline.hardwareObjects[`${hwoId}switch`],
  );

  function handleToggleClick() {
    dispatch(
      setAttribute(
        `${hwoId}switch`,
        lightSwitch.commands.find((state) => state !== lightSwitch.value),
      ),
    );
  }

  return (
    <div className={styles.controlWrapper}>
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="bottom"
        overlay={
          <Popover id={`${hwoId}_popover`} className={styles.popover} body>
            <input
              className="bar"
              type="range"
              step="0.1"
              min={light.limits[0]}
              max={light.limits[1]}
              value={light.value}
              disabled={light.state !== HW_STATE.READY}
              onChange={(evt) =>
                dispatch(setAttribute(hwoId, evt.target.value))
              }
            />
          </Popover>
        }
      >
        {({ ref, ...triggerHandlers }) => (
          <>
            <Button
              ref={ref}
              className={styles.lightBtn}
              data-default-styles
              active={lightSwitch.value === lightSwitch.commands[0]}
              title={`${label} on/off`}
              onClick={handleToggleClick}
            >
              <i className={`${styles.controlIcon} fas fa-lightbulb`} />
              <span className={styles.controlLabel}>{label}</span>
            </Button>
            <Button
              className={styles.lightArrowBtn}
              data-default-styles
              {...triggerHandlers}
            >
              <i className="fas fa-sort-down" />
            </Button>
          </>
        )}
      </OverlayTrigger>
    </div>
  );
}

export default LightControl;
