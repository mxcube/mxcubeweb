import React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';

import OneAxisTranslationControl from '../MotorInput/OneAxisTranslationControl';
import styles from './SampleControls.module.css';
import { useSelector } from 'react-redux';

function FocusControl() {
  const focusMotorProps = useSelector((state) =>
    state.uiproperties.sample_view.components.find((c) => c.role === 'focus'),
  );

  return (
    <OverlayTrigger
      trigger="click"
      rootClose
      placement="bottom"
      overlay={
        <div className={styles.overlay}>
          <OneAxisTranslationControl motorProps={focusMotorProps} />
        </div>
      }
    >
      <Button
        className={styles.controlBtn}
        name="focus"
        title="Focus"
        data-toggle="tooltip"
      >
        <i className={`${styles.controlIcon} fas fa-adjust`} />
        <span className={styles.controlLabel}>Focus</span>
      </Button>
    </OverlayTrigger>
  );
}

export default FocusControl;
