import SnapshotControl from './SnapshotControl';
import GridControl from './GridControl';
import CentringControl from './CentringControl';
import FocusControl from './FocusControl';
import ZoomControl from './ZoomControl';
import LightControl from './LightControl';
import VideoSizeControl from './VideoSizeControl';

import { useShowControl } from './utils';
import styles from './SampleControls.module.css';

function SampleControls(props) {
  const { canvas } = props;

  return (
    <div className={styles.controls}>
      {useShowControl('snapshot') && <SnapshotControl canvas={canvas} />}
      {useShowControl('draw_grid') && <GridControl />}
      {useShowControl('3_click_centring') && <CentringControl />}
      {useShowControl('focus') && <FocusControl />}
      {useShowControl('zoom') && <ZoomControl />}
      {useShowControl('backlight') && (
        <LightControl label="Backlight" hwoId="diffractometer.backlight" />
      )}
      {useShowControl('frontlight') && (
        <LightControl label="Frontlight" hwoId="diffractometer.frontlight" />
      )}
      {useShowControl('video_size') && <VideoSizeControl />}
    </div>
  );
}

export default SampleControls;
