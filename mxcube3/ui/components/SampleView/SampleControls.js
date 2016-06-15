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
    this.toogleFrontLight = this.toogleLight.bind(this, 'front');
    this.toogleBackLight = this.toogleLight.bind(this, 'back');
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.sampleViewState.zoom !== this.props.sampleViewState.zoom) {
      this.refs.zoomSlider.value = nextProps.sampleViewState.zoom;
    }
  }

  setZoom(option) {
    const currentZoom = parseInt(this.props.sampleViewState.zoom);
    if(option.target.name === 'zoomOut' && currentZoom > 1 ){
      this.props.sampleActions.sendZoomPos(currentZoom - 1);
    }else if(option.target.name === 'zoomSlider'){
      this.props.sampleActions.sendZoomPos(option.target.value);
    }else if(option.target.name === 'zoomIn' && currentZoom < 10){
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

  toogleLight(name) {
    const lighStatus = this.props.sampleViewState.lightOn[name];
    if (lighStatus) {
      this.props.sampleActions.sendLightOff(name);
    } else {
      this.props.sampleActions.sendLightOn(name);
    }
  }

  render() {
    return (
        <div className="sample-controlls sample-controlls-bottom text-center">
          <OverlayTrigger trigger="click" placement="top" rootClose overlay={
            <Popover id="Aperture" title="Aperture">
              <div className="form-inline">
                <div className="form-group">
                  <form>
                    <select
                      className="form-control"
                      defaultValue={this.props.sampleViewState.currentAperture}
                      onChange={this.setApertureSize}
                    >
                      {this.props.sampleViewState.apertureList.map((val, i) =>
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
            bsStyle="link"
          />
          </OverlayTrigger>

          <a
            href="#"
            id="downloadLink"
            type="button"
            data-toggle="tooltip"
            title="Take snapshot"
            className="btn btn-link pull-center"
            onClick={this.takeSnapShot}
            download
          >
            <i className="fa fa-2x fa-fw fa-camera"></i>
          </a>

          <Button
            type="button"
            data-toggle="tooltip"
            title="Start auto centring"
            className="fa fa-2x fa-arrows sample-controll"
            bsStyle="link"
            onClick={this.props.sampleActions.sendStartAutoCentring}
          />
          <Button
            type="button"
            data-toggle="tooltip"
            title="Start 3-click Centring"
            className="fa fa-2x fa-circle-o-notch sample-controll"
            bsStyle="link"
            onClick={this.props.sampleActions.sendStartClickCentring}
            active={this.props.sampleViewState.clickCentring}
          />

          <Button
            type="button"
            data-toggle="tooltip"
            title="Zoom out"
            className="fa fa-2x fa-search-minus sample-controll"
            bsStyle="link"
            onClick={this.setZoom}
            name="zoomOut"
          />

          <input
            className="bar"
            type="range"
            id="zoom-control"
            min="1" max="10"
            step="1"
            defaultValue={this.props.sampleViewState.zoom}
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
              className="fa fa-2x fa-search-plus sample-controll"
              bsStyle="link"
              onClick={this.setZoom}
              name="zoomIn"
            />

            <Button
              type="button"
              data-toggle="tooltip"
              title="Abort Centring"
              className="fa fa-2x fa-times sample-controll"
              bsStyle="link"
              onClick={this.props.sampleActions.sendAbortCentring}
            />

            <Button
              type="button"
              data-toggle="tooltip"
              title="Backlight On/Off"
              className="fa fa-2x fa-lightbulb-o sample-controll"
              bsStyle="link"
              onClick={this.toogleBackLight}
              active={this.props.sampleViewState.lightOn.back == 1}
            />
            <MotorInput
              title="BackLight"
              save={this.props.sampleActions.sendMotorPosition}
              value={this.props.sampleViewState.motors.BackLight.position}
              motorName="BackLight"
              step="0.1"
              decimalPoints="2"
              state={this.props.sampleViewState.motors.BackLight.Status}
            />

            <Button
              type="button"
              data-toggle="tooltip"
              title="Frontlight On/Off"
              className="fa fa-2x fa-lightbulb-o sample-controll"
              bsStyle="link"
              onClick={this.toogleFrontLight}
              active={this.props.sampleViewState.lightOn.front == 1}
            />
            <MotorInput
              title="FrontLight"
              save={this.props.sampleActions.sendMotorPosition}
              value={this.props.sampleViewState.motors.FrontLight.position}
              motorName="FrontLight"
              step="0.1"
              decimalPoints="2"
              state={this.props.sampleViewState.motors.FrontLight.Status}
            />
          </div>

        );
  }
}
