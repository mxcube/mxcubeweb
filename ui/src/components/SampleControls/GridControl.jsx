import React from 'react';
import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { toggleDrawGrid } from '../../actions/sampleview';
import styles from './SampleControls.module.css';

function GridControl() {
  const dispatch = useDispatch();
  const isActive = useSelector((state) => state.sampleview.drawGrid);

  return (
    <Button
      className={styles.controlBtn}
      data-default-styles
      active={isActive}
      title="Draw grid"
      onClick={() => dispatch(toggleDrawGrid())}
    >
      <i className={`${styles.controlIcon} fas fa-th`} />
      <span className={styles.controlLabel}>Draw grid</span>
    </Button>
  );
}

export default GridControl;
