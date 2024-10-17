/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { HW_STATE } from '../../constants';
import { setAttribute } from '../../actions/beamline';
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
          <div className={styles.overlay}>
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
          </div>
        }
      >
        {({ ref, ...triggerHandlers }) => (
          <>
            <Button
              ref={ref}
              className={styles.controlBtnWithOverlay}
              active={lightSwitch.value === lightSwitch.commands[0]}
              title={`${label} on/off`}
              onClick={handleToggleClick}
            >
              <i className={`${styles.controlIcon} fas fa-lightbulb`} />
              <span className={styles.controlLabel}>{label}</span>
            </Button>
            <Button className={styles.overlayTrigger} {...triggerHandlers}>
              <i className="fas fa-sort-down" />
            </Button>
          </>
        )}
      </OverlayTrigger>
    </div>
  );
}

export default LightControl;
