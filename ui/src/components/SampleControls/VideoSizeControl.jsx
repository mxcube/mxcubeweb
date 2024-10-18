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
      <Dropdown.Toggle className={styles.controlDropDown} variant="content">
        <i className={`${styles.controlIcon} fas fa-video`} />
        <i className={`${styles.dropDownIcon} fas fa-sort-down`} />
        <span className={styles.controlLabel}>Video size</span>
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.dropDownMenu}>
        {videoSizes.map(([w, h], i) => (
          <Dropdown.Item key={`${w}_${h}`} eventKey={i}>
            <span className={`${w === width ? 'fas' : 'far'} fa-circle`} />{' '}
            {`${w} x ${h}`}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default VideoSizeControl;
