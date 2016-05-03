import './SampleView.css';
import React from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap';
import MotorInput from './MotorInput';


export default class SampleControls extends React.Component {

    constructor(props) {
        super(props);
        this.takeSnapShot = this.takeSnapShot.bind(this);
        this.setZoom = this.setZoom.bind(this);
        this.setApertureSize = this.setApertureSize.bind(this);
        this.toogleFrontLight = this.toogleLight.bind(this, 'front');
        this.toogleBackLight = this.toogleLight.bind(this, 'back');
    }

    setZoom(option) {
        this.props.sampleActions.sendZoomPos(option.target.value);
    }

    setApertureSize(option) {
        this.props.sampleActions.sendChangeAperture(option.target.value);
    }

    takeSnapShot() {
        const img = document.getElementById("sample-img");
        const fimg = new fabric.Image(img);
        this.props.canvas.setBackgroundImage(fimg);
        this.props.canvas.renderAll();
        document.getElementById("downloadLink").href = this.props.canvas.toDataURL();
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
        <div className="sample-controlls sample-controlls-bottom">
        <div className="row">
                        <div className="col-sm-1">
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
                                                        {this.props.sampleViewState.apertureList.map((val, i) => {
                                                            return <option key={i} value={val}>{val}</option>
                                                        })}
                                                </select>
                                            </form>
                                        </div>
                                    </div>
                                </Popover>
                                }
                            >
                        <button type="button" data-toggle="tooltip" title="Set Aperture" className="btn btn-link pull-center"><i className="fa fa-2x fa-fw fa-dot-circle-o"></i></button>
                    </OverlayTrigger>
                        </div>
                          <div className="col-sm-1">
                                          <a href="#" id="downloadLink" type="button" data-toggle="tooltip" title="Take snapshot" className="btn btn-link  pull-center" onClick={this.takeSnapShot} download><i className="fa fa-2x fa-fw fa-camera"></i></a>

                        </div>
                          <div className="col-sm-1">
                                          <button type="button" data-toggle="tooltip" title="Start auto centring" className="btn btn-link pull-center" onClick={this.props.sampleActions.sendStartAutoCentring}>
                    <i className="fa fa-2x fa-fw fa-arrows"></i>
                </button>
                        </div>
                          <div className="col-sm-1">
                                          <button type="button" data-toggle="tooltip" title="Start 3-click centring" className="btn btn-link pull-center" onClick={this.props.sampleActions.sendStartClickCentring}>
                    <i className={"fa fa-2x fa-fw fa-circle-o-notch" + (this.props.sampleViewState.clickCentring ? " button-active" : "")}></i>
                </button>
                        </div>

                          <div className="col-sm-3 text-center">
                                                                                            <button type="button" data-toggle="tooltip" title="Zoom out" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>

                                          <input className="bar" type="range" id="zoom-control" min="0" max="9" step="1" defaultValue={this.props.sampleViewState.zoom} onMouseUp={this.setZoom} list="volsettings" />
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
                </datalist>
                                    <button type="button" data-toggle="tooltip" title="Zoom in" className="btn btn-link  pull-center">
                    <i className="fa fa-2x fa-fw fa fa-search-plus"></i>
                </button>
                        </div>

                        <div className="col-sm-1">
                                        <button type="button" data-toggle="tooltip" title="Abort Centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendAbortCentring}>
                    <i className="fa fa-2x fa-fw fa-times"></i>
                </button>
                        </div>







                <div className="col-sm-2">
                    <button type="button" data-toggle="tooltip" title="Backlight On/Off" className="btn btn-link pull-center light-button">
                        <i id="back-light-icon" className={"fa fa-2x fa-fw fa fa-lightbulb-o" + (this.props.sampleViewState.lightOn.back ? " button-active" : "")} onClick={this.toogleBackLight}></i>
                    </button>
                    <MotorInput
                      title="BackLight"
                      save={this.props.sampleActions.sendMotorPosition}
                      value={this.props.sampleViewState.motors.BackLight.position}
                      motorName="BackLight"
                      step="0.1"
                      decimalPoints="2"
                    />
                </div>

                <div className="col-sm-2">
                    <button type="button" data-toggle="tooltip" title="Frontlight On/Off" className="btn btn-link pull-center light-button">
                        <i id="front-light-icon" className={"fa fa-2x fa-fw fa fa-lightbulb-o" + (this.props.sampleViewState.lightOn.front ? " button-active" : "")} onClick={this.toogleFrontLight}></i>
                    </button>
                    <MotorInput
                      title="FrontLight"
                      save={this.props.sampleActions.sendMotorPosition}
                      value={this.props.sampleViewState.motors.FrontLight.position}
                      motorName="FrontLight"
                      step="0.1"
                      ecimalPoints="2"
                    />
                </div>
               </div>
        </div>
        );
    }
}
