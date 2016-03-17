'use strict';
import './SampleView.css';
import React from 'react'

export default class SampleControls extends React.Component {

    constructor(props) {
        super(props);
        this.takeSnapShot = this.takeSnapShot.bind(this);
        this.setZoom = this.setZoom.bind(this);
        this.setLigthStrengthFront = this.setLigthStrength.bind(this,"FrontLight");
        this.setLigthStrengthBack = this.setLigthStrength.bind(this,"BackLight");
        this.backLightOn = this.setLightOn.bind(this,"back");
        this.frontLightOn = this.setLightOn.bind(this,"front");
        this.backLightOff = this.setLightOff.bind(this,"back");
        this.frontLightOff = this.setLightOff.bind(this,"front");
    }



    setZoom(option){
        this.props.sampleActions.sendZoomPos(option.target.value);
    }

    takeSnapShot(){
        document.getElementById("downloadLink").href = this.state.canvas.toDataURL();
    }


    setLigthStrength(name, option){
        this.props.sampleActions.sendMotorPosition(name, option.target.value);
    }

    setLightOff(name){
        this.props.sampleActions.sendLightOff(name);
    }

    setLightOn(name){
        this.props.sampleActions.sendLightOn(name);
    }




render() {
    return (
        <div className="sample-controlls">
            <div className="text-center"> 
                <button type="button" data-toggle="tooltip"  title="Measure distance" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa-calculator"></i></button>                              
                <a href="#" id="downloadLink" type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={this.takeSnapShot} download><i className="fa fa-2x fa-fw fa-camera"></i></a>                            
                <button type="button" data-toggle="tooltip"  title="Start auto centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendStartAutoCentring}><i className="fa fa-2x fa-fw fa-arrows"></i></button>
                <button type="button" data-toggle="tooltip"  title="Start 3-click centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendStartClickCentring}><i className="fa fa-2x fa-fw fa-circle-o-notch"></i></button>
                <button type="button" data-toggle="tooltip"  title="Abort Centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendAbortCentring}><i className="fa fa-2x fa-fw fa-times"></i></button>
                <button id="zoom-button" type="button" data-toggle="tooltip"  title="Zoom out" className="btn btn-link  pull-center">
                    <div id="zoom-control">
                    <input className="bar" type="range" min="0" max="9" step="1" defaultValue={this.props.sampleViewState.zoom} onChange={this.setZoom} />
                    </div>
                    <i id="zoom-icon" className="fa fa-2x fa-fw fa fa-search"></i>
                </button>
                <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.backLightOff}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
                <input className="bar" type="range" id="light-control" min="0.0" max="2.0" step="0.1" defaultValue={this.props.sampleViewState.motors.BackLight.position} onChange={this.setLigthStrengthBack} />
                <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.backLightOn}><i className="fa fa-2x fa-fw fa fa-lightbulb-o light-on"></i> </button>
                <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.frontLightOff}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
                <input className="bar" type="range" id="light-control" min="0.0" max="2.0" step="0.1" defaultValue={this.props.sampleViewState.motors.FrontLight.position} onChange={this.setLigthStrengthFront} />
                <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.frontLightOn}><i className="fa fa-2x fa-fw fa fa-lightbulb-o light-on"></i> </button>

            </div>
        </div>

        );        
}
}



