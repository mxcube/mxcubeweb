import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setVideoSize } from '../../actions/sampleview';
import styles from './SampleControls.module.css';

function VideoSizeControl() {
  const dispatch = useDispatch();

  const videoSizes = useSelector((state) => state.sampleview.videoSizes);
  const width = useSelector((state) => state.sampleview.width);

  return (
    <Dropdown
      drop="down-centered"
      onSelect={(i) => dispatch(setVideoSize(...videoSizes[i]))}
    >
      <Dropdown.Toggle className={styles.dropdownBtn} data-default-styles>
        <i className={`${styles.controlIcon} fas fa-video`} />
        <i className={`${styles.dropdownIcon} fas fa-sort-down`} />
        <span className={styles.controlLabel}>Video size</span>
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.dropdownMenu}>
        {videoSizes.map(([w, h], i) => {
          const isActive = w.toString() === width;
          return (
            <Dropdown.Item
              key={`${w}_${h}`}
              className={styles.dropdownItem}
              data-default-styles
              eventKey={i}
              active={isActive}
            >
              <span className={`${isActive ? 'fas' : 'far'} fa-circle me-1`} />{' '}
              {`${w} x ${h}`}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default VideoSizeControl;
