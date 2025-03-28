import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

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
        <Popover id="FocusControl_popover" className={styles.popover} body>
          <OneAxisTranslationControl motorProps={focusMotorProps} />
        </Popover>
      }
    >
      <Button
        className={styles.popoverBtn}
        data-default-styles
        name="focus"
        title="Focus"
      >
        <i className={`${styles.controlIcon} fas fa-adjust`} />
        <span className={styles.controlLabel}>Focus</span>
      </Button>
    </OverlayTrigger>
  );
}

export default FocusControl;
