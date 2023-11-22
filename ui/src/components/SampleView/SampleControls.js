/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable sonarjs/no-duplicate-string */
import './SampleView.css';
import React from 'react';
import { OverlayTrigger, Button, Dropdown } from 'react-bootstrap';
import 'fabric';

import OneAxisTranslationControl from '../MotorInput/OneAxisTranslationControl';
import { MOTOR_STATE } from '../../constants';

import { find } from 'lodash';
import styles from './SampleControls.module.css';

const { fabric } = window;

export default class SampleControls extends React.Component {
  constructor(props) {
    super(props);

    this.takeSnapShot = this.takeSnapShot.bind(this);
    this.doTakeSnapshot = this.doTakeSnapshot.bind(this);
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

  componentDidMount() {
    window.takeSnapshot = this.doTakeSnapshot;
  }

  toggleDrawGrid() {
    // Cancel click centering before draw grid is started
    if (this.props.current.sampleID === '') {
      this.props.showErrorPanel(true, 'There is no sample mounted');
    } else {
      if (this.props.clickCentring) {
        this.props.sampleViewActions.sendAbortCentring();
      }

      this.props.sampleViewActions.toggleDrawGrid();
    }
  }

  doTakeSnapshot() {
    const img = document.querySelector('#sample-img');
    const fimg = new fabric.Image(img);
    fimg.scale(this.props.imageRatio);
    let imgDataURI = '';
    this.props.canvas.setBackgroundImage(fimg);
    this.props.canvas.renderAll();
    imgDataURI = this.props.canvas.toDataURL({ format: 'jpeg' });
    this.props.canvas.setBackgroundImage(0);
    this.props.canvas.renderAll();
    return { data: imgDataURI.slice(23), mime: imgDataURI.slice(0, 23) };
  }

  takeSnapShot(evt) {
    /* eslint-disable unicorn/consistent-function-scoping */
    function imageEpolog(props) {
      const { sampleID } = props.current;

      if (sampleID in props.sampleList) {
        return props.sampleList[sampleID].sampleName;
      }

      /* handle the case when sample is not mounted */
      return 'no-sample';
    }

    const img = this.doTakeSnapshot();
    const filename = `${this.props.proposal}-${imageEpolog(this.props)}.jpeg`;

    evt.currentTarget.href = img.mime + img.data;
    evt.currentTarget.download = filename;
  }

  toggleCentring() {
    const { sendStartClickCentring, sendAbortCentring } =
      this.props.sampleViewActions;
    const { clickCentring } = this.props;

    // If draw grid tool enabled, disable it before starting centering
    if (this.props.drawGrid) {
      this.props.sampleViewActions.toggleDrawGrid();
    }

    if (clickCentring) {
      sendAbortCentring();
    } else {
      sendStartClickCentring();
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
          ? 'fa-dot-circle-o'
          : 'fa-circle-o';

      return (
        <Dropdown.Item
          key={`${size[0]} x ${size[1]}`}
          eventKey="1"
          onClick={() =>
            this.props.sampleViewActions.setVideoSize(size[0], size[1])
          }
        >
          <span className={`fa ${sizeGClass}`} /> {`${size[0]} x ${size[1]}`}
        </Dropdown.Item>
      );
    });

    const autoScaleGClass = this.props.autoScale
      ? ' fa-check-square-o'
      : 'fa-square-o';

    items.push(
      <Dropdown.Item
        eventKey="3"
        key="auto scale"
        onClick={() => {
          const { clientWidth } = document.querySelector('#outsideWrapper');
          this.props.sampleViewActions.toggleAutoScale(clientWidth);
        }}
      >
        <span className={`fa ${autoScaleGClass}`} /> Auto Scale
      </Dropdown.Item>,
      <Dropdown.Item
        eventKey="3"
        key="reset"
        onClick={() => {
          window.initJSMpeg();
          this.props.sampleViewActions.setVideoSize(
            this.props.width,
            this.props.height,
          );
        }}
      >
        <span className="fas fa-redo" /> Reset
      </Dropdown.Item>,
    );

    return items;
  }

  render() {
    const { hardwareObjects } = this.props;

    const foucs_motor_uiprop = find(
      this.props.uiproperties.sample_view.components,
      {
        role: 'focus',
      },
    );

    const zoom_motor_uiprop = find(
      this.props.uiproperties.sample_view.components,
      {
        role: 'zoom',
      },
    );

    const focus_motor =
      this.props.hardwareObjects[foucs_motor_uiprop.attribute];
    const zoom_motor = this.props.hardwareObjects[zoom_motor_uiprop.attribute];

    return (
      <div className={styles.controls}>
        {this.props.getControlAvailability('snapshot') && (
          <Button
            as="a"
            className={styles.controlBtn}
            href="#"
            target="_blank"
            download
            title="Take snapshot"
            data-toggle="tooltip"
            onClick={this.takeSnapShot}
          >
            <i className={`${styles.controlIcon} fas fa-camera`} />
            <span className={styles.controlLabel}>Snapshot</span>
          </Button>
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
                <OneAxisTranslationControl
                  save={this.props.setAttribute}
                  value={focus_motor.value}
                  min={focus_motor.limits[0]}
                  max={focus_motor.limits[1]}
                  step={this.props.steps.focusStep}
                  motorName={foucs_motor_uiprop.attribute}
                  suffix={foucs_motor_uiprop.suffix}
                  decimalPoints={foucs_motor_uiprop.precision}
                  state={focus_motor.state}
                  disabled={this.props.motorsDisabled}
                />
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
                  min={zoom_motor.limits[0]}
                  max={zoom_motor.limits[1]}
                  value={zoom_motor.commands.indexOf(zoom_motor.value)}
                  disabled={zoom_motor.state !== MOTOR_STATE.READY}
                  onMouseUp={(e) => {
                    this.props.setAttribute(
                      'diffractometer.zoom',
                      zoom_motor.commands[Number.parseFloat(e.target.value)],
                    );
                  }}
                  onChange={(e) => {
                    this.props.setBeamlineAttribute(
                      'diffractometer.zoom',
                      zoom_motor.commands[Number.parseFloat(e.target.value)],
                    );
                  }}
                  list="volsettings"
                  name="zoomSlider"
                />

                <datalist id="volsettings">
                  {zoom_motor.commands.map((cmd, index) => (
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
                Zoom ({zoom_motor.value}){' '}
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
                      MOTOR_STATE.READY
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
                      MOTOR_STATE.READY
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
