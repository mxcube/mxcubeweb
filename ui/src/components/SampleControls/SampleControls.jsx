import React from 'react';

import SnapshotControl from './SnapshotControl';
import GridControl from './GridControl';
import CentringControl from './CentringControl';
import FocusControl from './FocusControl';
import ZoomControl from './ZoomControl';
import LightControl from './LightControl';
import VideoSizeControl from './VideoSizeControl';

import styles from './SampleControls.module.css';

class SampleControls extends React.Component {
  render() {
    const { getControlAvailability } = this.props;

    return (
      <div className={styles.controls}>
        {getControlAvailability('snapshot') && (
          <SnapshotControl canvas={this.props.canvas} />
        )}
        {getControlAvailability('draw_grid') && <GridControl />}
        {getControlAvailability('3_click_centring') && <CentringControl />}
        {getControlAvailability('focus') && <FocusControl />}
        {getControlAvailability('zoom') && <ZoomControl />}
        {getControlAvailability('backlight') && (
          <LightControl label="Frontlight" hwoId="diffractometer.backlight" />
        )}
        {getControlAvailability('frontlight') && (
          <LightControl label="Backlight" hwoId="diffractometer.frontlight" />
        )}
        {getControlAvailability('video_size') && <VideoSizeControl />}
      </div>
    );
  }
}

export default SampleControls;
