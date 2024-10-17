import React from 'react';
import { Dropdown } from 'react-bootstrap';

import SnapshotControl from './SnapshotControl';

import styles from './SampleControls.module.css';
import GridControl from './GridControl';
import CentringControl from './CentringControl';
import FocusControl from './FocusControl';
import ZoomControl from './ZoomControl';
import LightControl from './LightControl';

class SampleControls extends React.Component {
  constructor(props) {
    super(props);
    this.availableVideoSizes = this.availableVideoSizes.bind(this);
  }

  availableVideoSizes() {
    const items = this.props.videoSizes.map((size) => {
      const sizeGClass =
        this.props.width === String(size[0])
          ? 'fas fa-circle'
          : 'far fa-circle';

      return (
        <Dropdown.Item
          key={`${size[0]} x ${size[1]}`}
          eventKey="1"
          onClick={() =>
            this.props.sampleViewActions.setVideoSize(size[0], size[1])
          }
        >
          <span className={sizeGClass} /> {`${size[0]} x ${size[1]}`}
        </Dropdown.Item>
      );
    });

    items.push(
      <Dropdown.Item
        eventKey="3"
        key="reset"
        onClick={() => {
          this.props.sampleViewActions.setVideoSize(
            this.props.width,
            this.props.height,
          );
        }}
      >
        <span className="far fa-redo" /> Reset
      </Dropdown.Item>,
    );

    return items;
  }

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
        {getControlAvailability('video_size') && (
          <Dropdown drop="down-centered">
            <Dropdown.Toggle
              className={styles.controlDropDown}
              variant="content"
            >
              <i className={`${styles.controlIcon} fas fa-video`} />
              <i className={`${styles.dropDownIcon} fas fa-sort-down`} />
              <span className={styles.controlLabel}>Video size</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className={styles.dropDownMenu}>
              {this.availableVideoSizes()}
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
    );
  }
}

export default SampleControls;
