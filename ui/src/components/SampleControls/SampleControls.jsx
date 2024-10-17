/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import { OverlayTrigger, Button, Dropdown } from 'react-bootstrap';

import OneAxisTranslationControl from '../MotorInput/OneAxisTranslationControl';
import SnapshotControl from './SnapshotControl';
import { HW_STATE } from '../../constants';

import styles from './SampleControls.module.css';

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
    this.toggleCentring = this.toggleCentring.bind(this);
    this.toggleDrawGrid = this.toggleDrawGrid.bind(this);
    this.availableVideoSizes = this.availableVideoSizes.bind(this);
  }

  toggleDrawGrid() {
    // Cancel click centering before draw grid is started
    if (this.props.currentSampleID === '') {
      this.props.showErrorPanel(true, 'There is no sample mounted');
    } else {
      if (this.props.clickCentring) {
        this.props.sampleViewActions.abortCentring();
      }

      this.props.sampleViewActions.toggleDrawGrid();
    }
  }

  toggleCentring() {
    const { startClickCentring, abortCentring } = this.props.sampleViewActions;
    const { clickCentring } = this.props;

    // If draw grid tool enabled, disable it before starting centering
    if (this.props.drawGrid) {
      this.props.sampleViewActions.toggleDrawGrid();
    }

    if (clickCentring) {
      abortCentring();
    } else {
      startClickCentring();
    }
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
    const { hardwareObjects } = this.props;

    const focusMotorProps = this.props.uiproperties.sample_view.components.find(
      (c) => c.role === 'focus',
    );

    const zoomMotorProps = this.props.uiproperties.sample_view.components.find(
      (c) => c.role === 'zoom',
    );

    const zoomMotor = this.props.hardwareObjects[zoomMotorProps.attribute];

    return (
      <div className={styles.controls}>
        {this.props.getControlAvailability('snapshot') && (
          <SnapshotControl canvas={this.props.canvas} />
        )}
        {this.props.getControlAvailability('draw_grid') && (
          <Button
            className={styles.controlBtn}
            active={this.props.drawGrid}
            title="Draw grid"
            data-toggle="tooltip"
            onClick={this.toggleDrawGrid}
          >
            <i className={`${styles.controlIcon} fas fa-th`} />
            <span className={styles.controlLabel}>Draw grid</span>
          </Button>
        )}
        {this.props.getControlAvailability('3_click_centring') && (
          <Button
            className={styles.controlBtn}
            active={this.props.clickCentring}
            title="Start 3-click centring"
            data-toggle="tooltip"
            onClick={this.toggleCentring}
          >
            <i className={`${styles.controlIcon} fas fa-circle-notch`} />
            <span className={styles.controlLabel}>3-click centring</span>
          </Button>
        )}
        {this.props.getControlAvailability('focus') && (
          <OverlayTrigger
            trigger="click"
            rootClose
            placement="bottom"
            overlay={
              <div className={styles.overlay}>
                <OneAxisTranslationControl motorProps={focusMotorProps} />
              </div>
            }
          >
            <Button
              className={styles.controlBtn}
              name="focus"
              title="Focus"
              data-toggle="tooltip"
            >
              <i className={`${styles.controlIcon} fas fa-adjust`} />
              <span className={styles.controlLabel}>Focus</span>
            </Button>
          </OverlayTrigger>
        )}
        {this.props.getControlAvailability('zoom') && (
          <OverlayTrigger
            trigger="click"
            rootClose
            placement="bottom"
            overlay={
              <div className={styles.overlay}>
                <input
                  className={styles.zoomSlider}
                  type="range"
                  min={0}
                  max={zoomMotor.commands.length - 1}
                  value={zoomMotor.commands.indexOf(zoomMotor.value)}
                  disabled={zoomMotor.state !== HW_STATE.READY}
                  onMouseUp={(e) => {
                    this.props.setAttribute(
                      'diffractometer.zoom',
                      zoomMotor.commands[Number.parseFloat(e.target.value)],
                    );
                  }}
                  onChange={(e) => {
                    this.props.setBeamlineAttribute(
                      'diffractometer.zoom',
                      zoomMotor.commands[Number.parseFloat(e.target.value)],
                    );
                  }}
                  list="volsettings"
                  name="zoomSlider"
                />

                <datalist id="volsettings">
                  {zoomMotor.commands.map((cmd, index) => (
                    <option key={cmd} value={index} />
                  ))}
                </datalist>
              </div>
            }
          >
            <Button
              className={styles.controlBtn}
              name="zoomOut"
              title="Zoom in/out"
              data-toggle="tooltip"
            >
              <i className={`${styles.controlIcon} fas fa-search`} />
              <span className={styles.controlLabel}>
                Zoom ({zoomMotor.value}){' '}
              </span>
            </Button>
          </OverlayTrigger>
        )}
        {this.props.getControlAvailability('backlight') && (
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
        {this.props.getControlAvailability('frontlight') && (
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
        {this.props.getControlAvailability('video_size') && (
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
