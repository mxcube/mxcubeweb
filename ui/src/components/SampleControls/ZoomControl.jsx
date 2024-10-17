/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { HW_STATE } from '../../constants';
import { setAttribute } from '../../actions/beamline';
import styles from './SampleControls.module.css';

const ZOOM_HWO_ID = 'diffractometer.zoom';

function ZoomControl() {
  const dispatch = useDispatch();

  const { state, value, commands } = useSelector(
    (state) => state.beamline.hardwareObjects[ZOOM_HWO_ID],
  );

  return (
    <OverlayTrigger
      trigger="click"
      rootClose
      placement="bottom"
      overlay={
        <div className={styles.overlay}>
          <input
            className={styles.zoomSlider}
            name="zoomSlider"
            type="range"
            list="ZoomControl_commands"
            min={0}
            max={commands.length - 1}
            value={commands.indexOf(value)}
            disabled={state !== HW_STATE.READY}
            onChange={(evt) => {
              const cmdIndex = Number.parseFloat(evt.target.value);
              dispatch(setAttribute(ZOOM_HWO_ID, commands[cmdIndex]));
            }}
          />

          <datalist id="ZoomControl_commands">
            {commands.map((cmd, index) => (
              <option key={cmd} value={index} />
            ))}
          </datalist>
        </div>
      }
    >
      <Button
        className={styles.controlBtn}
        name="zoomOut"
        title="Zoom in/out"
        data-toggle="tooltip"
      >
        <i className={`${styles.controlIcon} fas fa-search`} />
        <span className={styles.controlLabel}>Zoom ({value}) </span>
      </Button>
    </OverlayTrigger>
  );
}

export default ZoomControl;
