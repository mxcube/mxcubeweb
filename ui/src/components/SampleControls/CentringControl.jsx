import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { toggleCentring } from '../../actions/sampleview';
import styles from './SampleControls.module.css';

function CentringControl() {
  const dispatch = useDispatch();
  const isActive = useSelector((state) => state.sampleview.clickCentring);

  return (
    <Button
      className={styles.controlBtn}
      data-default-styles
      active={isActive}
      title={`${isActive ? 'Stop' : 'Start'} 3-click centring`}
      onClick={() => dispatch(toggleCentring())}
    >
      <i className={`${styles.controlIcon} fas fa-circle-notch`} />
      <span className={styles.controlLabel}>3-click centring</span>
    </Button>
  );
}

export default CentringControl;
