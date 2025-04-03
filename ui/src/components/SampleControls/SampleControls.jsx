import { useSelector } from 'react-redux';

import CamerasControl from './CamerasControl';
import CentringControl from './CentringControl';
import FocusControl from './FocusControl';
import GridControl from './GridControl';
import LightControl from './LightControl';
import styles from './SampleControls.module.css';
import SnapshotControl from './SnapshotControl';
import { useShowControl } from './utils';
import VideoSizeControl from './VideoSizeControl';
import ZoomControl from './ZoomControl';

function SampleControls(props) {
  const { canvas } = props;
  let componentsToShow = useShowControl();
  const mainCameraStream = useSelector((state) => {
    const { videoHash, mainStreamHash } = state.sampleview;
    return videoHash.length === 1 && videoHash[0] === mainStreamHash;
  });
  const argusAttributes = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes,
  );

  if (!mainCameraStream) {
    componentsToShow = componentsToShow.includes('cameras') ? ['cameras'] : [];
  }

  return (
    <div className={styles.controls}>
      {componentsToShow.includes('snapshot') && (
        <SnapshotControl canvas={canvas} />
      )}
      {componentsToShow.includes('draw_grid') && <GridControl />}
      {componentsToShow.includes('click_centring') && <CentringControl />}
      {componentsToShow.includes('focus') && <FocusControl />}
      {componentsToShow.includes('zoom') && <ZoomControl />}
      {componentsToShow.includes('backlight') && (
        <LightControl label="Backlight" hwoId="diffractometer.backlight" />
      )}
      {componentsToShow.includes('frontlight') && (
        <LightControl label="Frontlight" hwoId="diffractometer.frontlight" />
      )}
      {componentsToShow.includes('video_size') && <VideoSizeControl />}
      {componentsToShow.includes('cameras') && argusAttributes && (
        <CamerasControl />
      )}
    </div>
  );
}

export default SampleControls;
