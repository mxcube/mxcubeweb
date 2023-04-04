import './SampleView.css';
import React from 'react';
import {
  OverlayTrigger, Button, Dropdown,
} from 'react-bootstrap';
import 'fabric';

import OneAxisTranslationControl from '../MotorInput/OneAxisTranslationControl';
import { MOTOR_STATE } from '../../constants';

import { find } from 'lodash';

const { fabric } = window;

export default class SampleControls extends React.Component {
  constructor(props) {
    super(props);

    this.takeSnapShot = this.takeSnapShot.bind(this);
    this.doTakeSnapshot = this.doTakeSnapshot.bind(this);
    this.setZoom = this.setZoom.bind(this);
    this.toggleFrontLight = this.toggleLight.bind(this, 'diffractometer.frontlight');
    this.toggleBackLight = this.toggleLight.bind(this, 'diffractometer.backlight');
    this.toggleCentring = this.toggleCentring.bind(this);
    this.toggleDrawGrid = this.toggleDrawGrid.bind(this);
    this.availableVideoSizes = this.availableVideoSizes.bind(this);
  }

  componentDidMount() {
    window.takeSnapshot = this.doTakeSnapshot;
  }

  setZoom(option) {
    const zoom_motor_uiprop = find(
      this.props.uiproperties.components, { role: 'zoom' }
    );

    const zoom_motor = this.props.hardwareObjects[zoom_motor_uiprop.attribute];
    const newZoom = zoom_motor.commands[option.target.value];
    this.props.sendSetAttribute('diffractometer.zoom', newZoom);
  }

  toggleDrawGrid() {
    // Cancel click centering before draw grid is started
    if (this.props.current.sampleID === '') {
      this.props.generalActions.showErrorPanel(
        true,
        'There is no sample mounted'
      );
    } else {
      if (this.props.clickCentring) {
        this.props.sampleActions.sendAbortCentring();
      }

      this.props.sampleActions.toggleDrawGrid();
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

  takeSnapShot() {
    /* eslint-disable unicorn/consistent-function-scoping */
    function imageEpolog(props) {
      const sampleID = props.current.sampleID;

      if (sampleID in props.sampleList) {
        return props.sampleList[sampleID].sampleName;
      }

      /* handle the case when sample is not mounted */
      return "no-sample";
    }

    const img = this.doTakeSnapshot();
    const filename = `${this.props.proposal}-${imageEpolog(this.props)}.jpeg`;

    document.querySelector('#downloadLink').href = img.mime + img.data;
    document.querySelector('#downloadLink').download = filename;
  }

  toggleCentring() {
    const { sendStartClickCentring, sendAbortCentring } =
      this.props.sampleActions;
    const { clickCentring } = this.props;

    // If draw grid tool enabled, disable it before starting centering
    if (this.props.drawGrid) {
      this.props.sampleActions.toggleDrawGrid();
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
      (state) => state !== lighstate
    );
    this.props.sendSetAttribute(`${name}switch`, newState);
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
          onClick={() => this.props.sampleActions.setVideoSize(size[0], size[1])}
        >
          <span className={`fa ${sizeGClass}`} />
          {' '}
          {`${size[0]} x ${size[1]}`}
        </Dropdown.Item>
      );
    });

    const autoScaleGClass = this.props.autoScale ? ' fa-check-square-o' : 'fa-square-o';

    items.push((
      <Dropdown.Item
        eventKey="3"
        key="auto scale"
        onClick={() => {
          const { clientWidth } = document.querySelector('#outsideWrapper');
          this.props.sampleActions.toggleAutoScale(clientWidth);
        }}
      >
        <span className={`fa ${autoScaleGClass}`} />
        {' '}
        Auto Scale
      </Dropdown.Item>), (
      <Dropdown.Item
        eventKey="3"
        key="reset"
        onClick={() => {
          window.initJSMpeg();
          this.props.sampleActions.setVideoSize(this.props.width, this.props.height);
        }}
      >
        <span className="fas fa-redo" />
        {' '}
        Reset
      </Dropdown.Item>));

    return items;
  }

  render() {
    const { hardwareObjects } = this.props;

    const foucs_motor_uiprop = find(
      this.props.uiproperties.components, { role: 'focus' }
    );

    const zoom_motor_uiprop = find(
      this.props.uiproperties.components, { role: 'zoom' }
    );

    const focus_motor = this.props.hardwareObjects[foucs_motor_uiprop.attribute];
    const zoom_motor = this.props.hardwareObjects[zoom_motor_uiprop.attribute];

    return (
      <div style={{ display: 'flex', position: 'absolute', width: '100%' }}>
        <div className="sample-controlls text-center">
          <ul className="bs-glyphicons-list">
            <li>
              <Button
                id="downloadLink"
                data-toggle="tooltip"
                title="Take snapshot"
                className="fas fa-camera sample-control"
                onClick={this.takeSnapShot}
                target="_blank"
                download
              />
              <span className="sample-control-label">Snapshot</span>
            </li>
            <li>
              <Button
                type="button"
                data-toggle="tooltip"
                title="Draw grid"
                className="fas fa-th sample-control"
                onClick={this.toggleDrawGrid}
                active={this.props.drawGrid}
              />
              <span className="sample-control-label">Draw grid</span>
            </li>
            <li>
              <Button
                type="button"
                data-toggle="tooltip"
                title="Start 3-click Centring"
                className="fas fa-circle-notch sample-control"
                onClick={this.toggleCentring}
                active={this.props.clickCentring}
              />
              <span className="sample-control-label">3-click Centring</span>
            </li>
            {process.env.REACT_APP_FOCUSCONTROLONCANVAS
              ? (
                <li>
                  <OverlayTrigger
                    trigger="click"
                    rootClose
                    placement="bottom"
                    overlay={(
                      <span className="slider-overlay" style={{ marginTop: '20px' }}>
                        <OneAxisTranslationControl
                          save={this.props.sendSetAttribute}
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
                      </span>
                    )}
                  >
                    <Button
                      name="focus"
                      type="button"
                      data-toggle="tooltip"
                      title="Focus"
                      className="fas fa-adjust sample-control"
                    />
                  </OverlayTrigger>
                  <span className="sample-control-label">Focus</span>
                </li>
              ) : null}
            <OverlayTrigger
              trigger="click"
              rootClose
              placement="bottom"
              overlay={(
                <span className="slider-overlay">
                  {zoom_motor.limits[0]}
                  <input
                    style={{ top: '20px' }}
                    className="bar"
                    type="range"
                    id="zoom-control"
                    min={zoom_motor.limits[0]}
                    max={zoom_motor.limits[1]}
                    step="1"
                    value={zoom_motor.commands.indexOf(zoom_motor.value)}
                    disabled={zoom_motor.state !== MOTOR_STATE.READY}
                    onMouseUp={this.setZoom}
                    onChange={(e) => {
                      this.props.setBeamlineAttribute('diffractometer.zoom', zoom_motor.commands[e.target.value])
                    }}
                    list="volsettings"
                    name="zoomSlider"
                  />
                  {zoom_motor.limits[1]}
                </span>
              )}
            >
              <li>
                <Button
                  type="button"
                  data-toggle="tooltip"
                  title="Zoom in/out"
                  className="fas fa-search sample-control"
                  name="zoomOut"
                />
                <datalist id="volsettings">
                  {[
                    ...new Array(
                      zoom_motor.limits[1] - zoom_motor.limits[0]
                    ).keys(),
                  ].map((i) => (
                    <option key={`volsettings-${i}`}>{zoom_motor.limits[0] + i}</option>
                  ))}
                </datalist>
                <span className="sample-control-label">Zoom</span>
              </li>
            </OverlayTrigger>
            <li>
              <Button
                style={{ paddingRight: '0px' }}
                type="button"
                data-toggle="tooltip"
                title="Backlight On/Off"
                className="fas fa-lightbulb sample-control"
                onClick={this.toggleBackLight}
                active={
                  hardwareObjects["diffractometer.backlightswitch"].value ===
                  hardwareObjects["diffractometer.backlightswitch"].commands[0]
                }
              />
              <OverlayTrigger
                trigger="click"
                rootClose
                placement="bottom"
                overlay={(
                  <span className="slider-overlay" style={{ marginTop: '20px' }}>
                    <input
                      style={{ top: '20px' }}
                      className="bar"
                      type="range"
                      step="0.1"
                      min={hardwareObjects["diffractometer.backlight"].limits[0]}
                      max={hardwareObjects["diffractometer.backlight"].limits[1]}
                      value={hardwareObjects["diffractometer.backlight"].value}
                      disabled={hardwareObjects["diffractometer.backlight"].state !== MOTOR_STATE.READY}
                      onMouseUp={e => this.props.sendSetAttribute('diffractometer.backlight', e.target.value)}
                      onChange={e => this.props.setBeamlineAttribute('diffractometer.backlight', e.target.value)}
                      name="backlightSlider"
                    />
                  </span>
                )}
              >
                <Button
                  type="button"
                  className="ps-2 fas fa-sort-down sample-control sample-control-small"
                />
              </OverlayTrigger>
              <span className="sample-control-label">Backlight</span>
            </li>
            <li>
              <Button
                style={{ paddingRight: '0px' }}
                type="button"
                data-toggle="tooltip"
                title="Front On/Off"
                className="fas fa-lightbulb sample-control"
                onClick={this.toggleFrontLight}
                active={
                  hardwareObjects["diffractometer.frontlightswitch"].value === hardwareObjects["diffractometer.frontlightswitch"].commands[0]
                }
              />
              <OverlayTrigger
                trigger="click"
                rootClose
                placement="bottom"
                overlay={(
                  <span className="slider-overlay" style={{ marginTop: '20px' }}>
                    <input
                      className="bar"
                      type="range"
                      step="0.1"
                      min={hardwareObjects["diffractometer.frontlight"].limits[0]}
                      max={hardwareObjects["diffractometer.frontlight"].limits[1]}
                      value={hardwareObjects["diffractometer.frontlight"].value}
                      disabled={hardwareObjects["diffractometer.frontlight"].state !== MOTOR_STATE.READY}
                      onMouseUp={e => this.props.sendSetAttribute('frontlight', e.target.value)}
                      onChange={e => this.props.setBeamlineAttribute('frontlight', e.target.value)}
                      name="frontLightSlider"
                    />
                  </span>
                )}
              >
                <Button
                  type="button"
                  className="ps-2 fas fa-sort-down sample-control sample-control-small"
                />
              </OverlayTrigger>
              <span className="sample-control-label">Frontlight</span>
            </li>
            <li>
              <Dropdown>
                <Dropdown.Toggle
                  className="sample-control"
                  variant="content"
                  id="video-size-dropdown"
                  style={{ lineHeight: '0' }}
                >
                  <i className="fas fa-1x fa-video" />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {this.availableVideoSizes()}
                </Dropdown.Menu>
              </Dropdown>
              <span className="sample-control-label">Video size</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}
