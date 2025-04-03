import { Dropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setVideoSource } from '../../actions/sampleview';
import styles from './SampleControls.module.css';

function CamerasControl() {
  const dispatch = useDispatch();
  const cameras = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes?.camera_streams,
  );
  const multiViews = useSelector((state) => state.sampleview.multiViews);
  const streamProxyUrl = useSelector(
    (state) =>
      state.beamline.hardwareObjects.argus?.attributes?.stream_proxy_url,
  );
  const activeStream = useSelector((state) => state.sampleview.videoHash);

  return (
    <Dropdown
      drop="down-centered"
      onSelect={(stream) => {
        dispatch(setVideoSource(streamProxyUrl, stream.split(',')));
      }}
    >
      <Dropdown.Toggle className={styles.dropdownBtn} data-default-styles>
        <i className={`${styles.controlIcon} fas fa-video`} />
        <i className={`${styles.dropdownIcon} fas fa-sort-down`} />
        <span className={styles.controlLabel}>Cameras</span>
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.dropdownMenu}>
        {cameras &&
          Object.entries(cameras).map((stream) => {
            const key = stream.slice(0, 1);
            const isActive =
              key[0] ===
              (Array.isArray(activeStream)
                ? activeStream.join(',')
                : activeStream);
            return (
              <Dropdown.Item
                key={key}
                className={styles.dropdownItem}
                data-default-styles
                eventKey={[key]}
                active={isActive}
              >
                <span
                  className={`${isActive ? 'fas' : 'far'} fa-circle me-1`}
                />{' '}
                {key}
              </Dropdown.Item>
            );
          })}
        {cameras &&
          multiViews &&
          Object.entries(multiViews).map(([key, streams]) => {
            const isActive =
              streams.join(',') ===
              (Array.isArray(activeStream)
                ? activeStream.join(',')
                : activeStream);
            return (
              <Dropdown.Item
                key={key}
                className={styles.dropdownItem}
                data-default-styles
                eventKey={streams}
                active={isActive}
              >
                <span
                  className={`${isActive ? 'fas' : 'far'} fa-circle me-1`}
                />{' '}
                {key}
              </Dropdown.Item>
            );
          })}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default CamerasControl;
