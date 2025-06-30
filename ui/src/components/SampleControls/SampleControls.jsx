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

  return (
    <div className={styles.controls}>
      {useShowControl('snapshot') && <SnapshotControl canvas={canvas} />}
      {useShowControl('draw_grid') && <GridControl />}
      {useShowControl('click_centring') && <CentringControl />}
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
