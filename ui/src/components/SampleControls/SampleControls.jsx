/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import { OverlayTrigger, Button, Dropdown } from 'react-bootstrap';

import SnapshotControl from './SnapshotControl';
import { HW_STATE } from '../../constants';

import styles from './SampleControls.module.css';
import GridControl from './GridControl';
import CentringControl from './CentringControl';
import FocusControl from './FocusControl';
import ZoomControl from './ZoomControl';

class SampleControls extends React.Component {
  constructor(props) {
    super(props);

    this.toggleFrontLight = this.toggleLight.bind(
      this,
      'diffractometer.frontlight',
    );
    this.toggleBackLight = this.toggleLight.bind(
      this,
      'diffractometer.backlight',
    );
    this.availableVideoSizes = this.availableVideoSizes.bind(this);
  }

  toggleLight(name) {
    const lighstate = this.props.hardwareObjects[`${name}switch`].value;
    const newState = this.props.hardwareObjects[`${name}switch`].commands.find(
      (state) => state !== lighstate,
    );
    this.props.setAttribute(`${name}switch`, newState);
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
    const { hardwareObjects, getControlAvailability } = this.props;

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
          <div className={styles.controlWrapper}>
            <OverlayTrigger
              trigger="click"
              rootClose
              placement="bottom"
              overlay={
                <div className={styles.overlay}>
                  <input
                    className="bar"
                    type="range"
                    step="0.1"
                    min={hardwareObjects['diffractometer.backlight'].limits[0]}
                    max={hardwareObjects['diffractometer.backlight'].limits[1]}
                    value={hardwareObjects['diffractometer.backlight'].value}
                    disabled={
                      hardwareObjects['diffractometer.backlight'].state !==
                      HW_STATE.READY
                    }
                    onMouseUp={(e) =>
                      this.props.setAttribute(
                        'diffractometer.backlight',
                        e.target.value,
                      )
                    }
                    onChange={(e) =>
                      this.props.setBeamlineAttribute(
                        'diffractometer.backlight',
                        e.target.value,
                      )
                    }
                    name="backlightSlider"
                  />
                </div>
              }
            >
              {({ ref, ...triggerHandlers }) => (
                <>
                  <Button
                    ref={ref}
                    className={styles.controlBtnWithOverlay}
                    active={
                      hardwareObjects['diffractometer.backlightswitch']
                        .value ===
                      hardwareObjects['diffractometer.backlightswitch']
                        .commands[0]
                    }
                    title="Backlight On/Off"
                    data-toggle="tooltip"
                    onClick={this.toggleBackLight}
                  >
                    <i className={`${styles.controlIcon} fas fa-lightbulb`} />
                    <span className={styles.controlLabel}>Backlight</span>
                  </Button>
                  <Button
                    className={styles.overlayTrigger}
                    {...triggerHandlers}
                  >
                    <i className="fas fa-sort-down" />
                  </Button>
                </>
              )}
            </OverlayTrigger>
          </div>
        )}
        {getControlAvailability('frontlight') && (
          <div className={styles.controlWrapper}>
            <OverlayTrigger
              trigger="click"
              rootClose
              placement="bottom"
              overlay={
                <div className={styles.overlay}>
                  <input
                    className="bar"
                    type="range"
                    step="0.1"
                    min={hardwareObjects['diffractometer.frontlight'].limits[0]}
                    max={hardwareObjects['diffractometer.frontlight'].limits[1]}
                    value={hardwareObjects['diffractometer.frontlight'].value}
                    disabled={
                      hardwareObjects['diffractometer.frontlight'].state !==
                      HW_STATE.READY
                    }
                    onMouseUp={(e) =>
                      this.props.setAttribute(
                        'diffractometer.frontlight',
                        e.target.value,
                      )
                    }
                    onChange={(e) =>
                      this.props.setBeamlineAttribute(
                        'diffractometer.frontlight',
                        e.target.value,
                      )
                    }
                    name="frontLightSlider"
                  />
                </div>
              }
            >
              {({ ref, ...triggerHandlers }) => (
                <>
                  <Button
                    ref={ref}
                    className={styles.controlBtnWithOverlay}
                    active={
                      hardwareObjects['diffractometer.frontlightswitch']
                        .value ===
                      hardwareObjects['diffractometer.frontlightswitch']
                        .commands[0]
                    }
                    title="Front On/Off"
                    data-toggle="tooltip"
                    onClick={this.toggleFrontLight}
                  >
                    <i className={`${styles.controlIcon} fas fa-lightbulb`} />
                    <span className={styles.controlLabel}>Frontlight</span>
                  </Button>
                  <Button
                    className={styles.overlayTrigger}
                    {...triggerHandlers}
                  >
                    <i className="fas fa-sort-down" />
                  </Button>
                </>
              )}
            </OverlayTrigger>
          </div>
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
