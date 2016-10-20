import './SampleView.css';
import React from 'react';
import { OverlayTrigger, Popover, Button } from 'react-bootstrap';
import MotorInput from './MotorInput';
import 'fabric';
const fabric = window.fabric;

export default class SampleControls extends React.Component {


  constructor(props) {
    super(props);
    this.takeSnapShot = this.takeSnapShot.bind(this);
    this.setZoom = this.setZoom.bind(this);
    this.setApertureSize = this.setApertureSize.bind(this);
    this.toggleFrontLight = this.toggleLight.bind(this, 'FrontLight');
    this.toggleBackLight = this.toggleLight.bind(this, 'BackLight');
    this.toggleCentring = this.toggleCentring.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.zoom !== this.props.zoom) {
      this.refs.zoomSlider.value = nextProps.zoom;
    }
  }

  setZoom(option) {
    const currentZoom = this.props.zoom;
    if (option.target.name === 'zoomOut' && currentZoom > 1) {
      this.props.sampleActions.sendZoomPos(currentZoom - 1);
    } else if (option.target.name === 'zoomSlider') {
      this.props.sampleActions.sendZoomPos(option.target.value);
    } else if (option.target.name === 'zoomIn' && currentZoom < 10) {
      this.props.sampleActions.sendZoomPos(currentZoom + 1);
    }
  }

  setApertureSize(option) {
    this.props.sampleActions.sendChangeAperture(option.target.value);
  }

  takeSnapShot() {
    const img = document.getElementById('sample-img');
    const fimg = new fabric.Image(img);
    this.props.canvas.setBackgroundImage(fimg);
    this.props.canvas.renderAll();
    document.getElementById('downloadLink').href = this.props.canvas.toDataURL();
    this.props.canvas.setBackgroundImage(0);
    this.props.canvas.renderAll();
  }

  toggleCentring() {
    const { sendStartClickCentring, sendAbortCentring } = this.props.sampleActions;
    const { clickCentring } = this.props;
    if (clickCentring) {
      sendAbortCentring();
    } else {
      sendStartClickCentring();
    }
  }

  toggleLight(name) {
    const lighStatus = this.props.motors[`${name}Switch`].Status;
    if (lighStatus) {
      this.props.sampleActions.sendLightOff(name.toLowerCase());
    } else {
      this.props.sampleActions.sendLightOn(name.toLowerCase());
    }
  }

  render() {
    const motors = this.props.motors;
    return (
      <div style={ { float: 'left', position: 'absolute', width: '100%', zIndex: 1000 } } >
        <div
          className="sample-controlls text-center"
          style={ { marginLeft: 'auto', marginRight: 'auto', width: '64em' } }
        >
          <ul className="bs-glyphicons-list">
          <li>
          <OverlayTrigger trigger="click" placement="top" rootClose overlay={
            <Popover id="Aperture" title="Aperture">
              <div className="form-inline">
                <div className="form-group">
                  <form>
                    <select
                      className="form-control"
                      defaultValue={this.props.currentAperture}
                      onChange={this.setApertureSize}
                    >
                      {this.props.apertureList.map((val, i) =>
                        (<option key={i} value={val}>{val}</option>)
                      )}
                    </select>
                  </form>
                </div>
              </div>
            </Popover>
            }
          >
          <Button
            type="button"
            data-toggle="tooltip"
            title="Set Aperture"
            className="fa fa-2x fa-dot-circle-o sample-controll"
          />
          </OverlayTrigger>
          <span className="sample-controll-label">Aperture</span>
          </li>
          <li>
          <Button
            href="#"
            id="downloadLink"
            type="button"
            data-toggle="tooltip"
            title="Take snapshot"
            className="fa fa-camera sample-controll"
            onClick={this.takeSnapShot}
            download
          />
          <span className="sample-controll-label">Snapshot</span>
          </li>
          <li>
          <Button
            type="button"
            data-toggle="tooltip"
            title="Start auto centring"
            className="fa fa-arrows sample-controll"
            onClick={this.props.sampleActions.sendStartAutoCentring}
          />
          <span className="sample-controll-label">Auto-Centring</span>
          </li>
          <li>
          <Button
            type="button"
            data-toggle="tooltip"
            title="Start 3-click Centring"
            className="fa fa-circle-o-notch sample-controll"
            onClick={this.toggleCentring}
            active={this.props.clickCentring}
          />
          <span className="sample-controll-label">3-click Centring</span>
          </li>
          <li>
          <Button
            type="button"
            data-toggle="tooltip"
            title="Zoom out"
            className="fa fa-search-minus sample-controll"
            onClick={this.setZoom}
            name="zoomOut"
          />
          <input
            className="bar"
            type="range"
            id="zoom-control"
            min="1" max="10"
            step="1"
            defaultValue={this.props.zoom}
            onMouseUp={this.setZoom}
            list="volsettings"
            ref="zoomSlider"
            name="zoomSlider"
          />
            <datalist id="volsettings">
                <option>0</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
                <option>7</option>
                <option>8</option>
                <option>9</option>
                <option>10</option>
            </datalist>
            <Button
              type="button"
              data-toggle="tooltip"
              title="Zoom in"
              className="fa fa-search-plus sample-controll"
              onClick={this.setZoom}
              name="zoomIn"
            />
            <span className="sample-controll-label">Zoom Controls</span>
            </li>
            <li>
            <Button
              type="button"
              data-toggle="tooltip"
              title="Backlight On/Off"
              className="fa fa-lightbulb-o sample-controll"
              onClick={this.toggleBackLight}
              active={motors.BackLightSwitch.Status === 1}
            />
            <div style={{ display: 'inline-block', width: '100px !important' }}>
              <MotorInput
                className="motor-input-sm"
                title="BackLight"
                save={this.props.sampleActions.sendMotorPosition}
                value={motors.BackLight.position}
                motorName="BackLight"
                step="0.1"
                decimalPoints="2"
                state={motors.BackLight.Status}
              />
            </div>
            <span className="sample-controll-label">Backlight Controls</span>
            </li>
            <li>
            <Button
              type="button"
              data-toggle="tooltip"
              title="Frontlight On/Off"
              className="fa fa-lightbulb-o sample-controll"
              onClick={this.toggleFrontLight}
              active={motors.FrontLightSwitch.Status === 1}
            />
            <div style={{ display: 'inline-block', width: '100px !important' }}>
              <MotorInput
                title="FrontLight"
                save={this.props.sampleActions.sendMotorPosition}
                value={motors.FrontLight.position}
                motorName="FrontLight"
                step="0.1"
                decimalPoints="2"
                state={motors.FrontLight.Status}
              />
            </div>
            <span className="sample-controll-label">Frontlight Controls</span>
            </li>
            </ul>
          </div>
        </div>
        );
  }
}
