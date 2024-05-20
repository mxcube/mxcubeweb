import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { toggleCentring } from '../../actions/sampleview';
import styles from './SampleControls.module.css';

function CentringControl(props) {
  const { manualCentringName } = props
  const dispatch = useDispatch();
  const isActive = useSelector((state) => state.sampleview.clickCentring);

  return (
    <Button
      className={styles.controlBtn}
      data-default-styles
      active={isActive}
      title={`${isActive ? 'Stop' : 'Start'} ${manualCentringName} centring`}
      onClick={() => dispatch(toggleCentring())}
    >
      <i className={`${styles.controlIcon} fas fa-circle-notch`} />
      <span className={styles.controlLabel}>{`${manualCentringName} centring`}</span>
    </Button>
  );
}

export default CentringControl;
