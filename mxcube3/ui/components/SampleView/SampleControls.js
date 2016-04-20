'use strict';
import './SampleView.css';
import React from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap';

export default class SampleControls extends React.Component {

    constructor(props) {
        super(props);
        this.takeSnapShot = this.takeSnapShot.bind(this);
        this.setZoom = this.setZoom.bind(this);
        this.setLigthStrength = this.setLigthStrength.bind(this);
        this.setApertureSize = this.setApertureSize.bind(this);
        this.setLigthStrengthStep = this.setLigthStrengthStep.bind(this);
        this.toogleFrontLight = this.toogleLight.bind(this,'front');
        this.toogleBackLight = this.toogleLight.bind(this,'back');
    }



    setZoom(option){
        this.props.sampleActions.sendZoomPos(option.target.value);
    }

    takeSnapShot(){
        document.getElementById("downloadLink").href = this.props.canvas.toDataURL();
    }

    setApertureSize(option){
        this.props.sampleActions.sendChangeAperture(option.target.value);
    }    

    setLigthStrength(option){
        option.preventDefault(); 
        option.stopPropagation();
        if([13,38,40].includes(option.keyCode)){
            this.props.sampleActions.sendMotorPosition(option.target.name, option.target.value);
        }
    }
    setLigthStrengthStep(option){
            this.props.sampleActions.sendMotorPosition(option.target.name, option.target.value);
    }

    toogleLight(name){

        let lighStatus = this.props.sampleViewState.lightOn[name];
        if(lighStatus){
            this.props.sampleActions.sendLightOff(name);
        }else{
            this.props.sampleActions.sendLightOn(name);
        }
    }




render() {
    return (
        <div className="sample-controlls sample-controlls-bottom">
            <div className="text-center"> 
                    <OverlayTrigger trigger="click" placement="top" rootClose overlay={
                        <Popover id="Aperture" title="Aperture">
                            <div className="form-inline">
                                <div className="form-group">
                                    <form onSubmit={this.setLigthStrength} noValidate>
                                        <select className="form-control" defaultValue={this.props.sampleViewState.currentAperture} onChange={this.setApertureSize}>
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
                        <button type="button" data-toggle="tooltip"  title="Start auto centring" className="btn btn-link pull-center"><i className="fa fa-2x fa-fw fa-dot-circle-o"></i></button>
                    </OverlayTrigger>
                <button type="button" data-toggle="tooltip"  title="Measure distance" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa-calculator"></i></button>                              
                <a href="#" id="downloadLink" type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={this.takeSnapShot} download><i className="fa fa-2x fa-fw fa-camera"></i></a>                            
                <button type="button" data-toggle="tooltip"  title="Start auto centring" className="btn btn-link pull-center" onClick={this.props.sampleActions.sendStartAutoCentring}><i className="fa fa-2x fa-fw fa-arrows"></i></button>
                <button type="button" data-toggle="tooltip"  title="Start 3-click centring" className="btn btn-link pull-center" onClick={this.props.sampleActions.sendStartClickCentring}>
                    <i className={"fa fa-2x fa-fw fa-circle-o-notch" + (this.props.sampleViewState.clickCentring ? " button-active" : "")}></i>
                </button>
                <button type="button" data-toggle="tooltip"  title="Zoom out" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>
                <input className="bar" type="range" id="zoom-control" min="0" max="9" step="1" defaultValue={this.props.sampleViewState.zoom} onMouseUp={this.setZoom} list="volsettings"/>
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
                <button type="button" data-toggle="tooltip"  title="Zoom in" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa fa-search-plus"></i></button>
                    
                <button type="button" data-toggle="tooltip"  title="Abort Centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendAbortCentring}><i className="fa fa-2x fa-fw fa-times"></i></button>

                <button type="button" data-toggle="tooltip"  title="Backlight On/Off" className="btn btn-link pull-center light-button">
                    <i id="back-light-icon" className={"fa fa-2x fa-fw fa fa-lightbulb-o" + (this.props.sampleViewState.lightOn.back ? " button-active" : "")} onClick={this.toogleBackLight}></i>
                </button>
                    <OverlayTrigger trigger="click" placement="top" rootClose overlay={
                        <Popover id="Backlight" title="Backlight">
                            <div className="form-inline">
                                <div className="form-group">
                                    <form onSubmit={this.setLigthStrength} noValidate>
                                        <input className="form-control input-sm" onKeyUp={this.setLigthStrength} onClick={this.setLigthStrengthStep} type="number" step="0.1" min="0" max="2" defaultValue={this.props.sampleViewState.motors.BackLight.position} name="BackLight"/>
                                    </form>
                                </div>
                            </div>
                        </Popover>
                        }
                    >
                        <span className="motor-value">{this.props.sampleViewState.motors.BackLight.position}</span>
                    </OverlayTrigger>
                <button type="button" data-toggle="tooltip"  title="Frontlight On/Off" className="btn btn-link pull-center light-button">
                    <i id="front-light-icon" className={"fa fa-2x fa-fw fa fa-lightbulb-o" + (this.props.sampleViewState.lightOn.front ? " button-active" : "")} onClick={this.toogleFrontLight}></i>
                </button>
                    <OverlayTrigger trigger="click" placement="top" rootClose overlay={
                        <Popover id="Backlight" title="Backlight">
                            <div className="form-inline">
                                <div className="form-group">
                                    <form onSubmit={this.setLigthStrength} noValidate>
                                        <input className="form-control input-sm" onKeyUp={this.setLigthStrength} onClick={this.setLigthStrengthStep} type="number" step="0.1" min="0" max="2" defaultValue={this.props.sampleViewState.motors.FrontLight.position} name="FrontLight"/>
                                    </form>
                                </div>
                            </div>
                        </Popover>
                        }
                    >
                        <span className="motor-value">{this.props.sampleViewState.motors.FrontLight.position}</span>
                    </OverlayTrigger>                                           

            </div>
        </div>

        );        
}
}



