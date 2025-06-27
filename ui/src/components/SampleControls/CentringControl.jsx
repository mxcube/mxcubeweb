import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { toggleCentring } from '../../actions/sampleview';
import styles from './SampleControls.module.css';

function CentringControl() {
  const dispatch = useDispatch();
  const isActive = useSelector((state) => state.sampleview.clickCentring);
  const numClicks = useSelector(
    (state) => state.general.clickCentringNumClicks,
  );

  return (
    <Button
      className={styles.controlBtn}
      data-default-styles
      active={isActive}
      title={`${isActive ? 'Stop' : 'Start'} ${numClicks}-click centring`}
      onClick={() => dispatch(toggleCentring())}
    >
      <i className={`${styles.controlIcon} fas fa-circle-notch`} />
      <span
        className={styles.controlLabel}
      >{`${numClicks}-click centring`}</span>
    </Button>
  );
}

export default CentringControl;
