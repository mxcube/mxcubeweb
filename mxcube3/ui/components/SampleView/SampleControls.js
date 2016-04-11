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
        this.toogleBackLight = this.toogleLight.bind(this,"back");
        this.toogleFrontLight = this.toogleLight.bind(this,"front");
    }



    setZoom(option){
        this.props.sampleActions.sendZoomPos(option.target.value);
    }

    takeSnapShot(){
        document.getElementById("downloadLink").href = this.props.canvas.toDataURL();
    }


    setLigthStrength(name, option){
        this.props.sampleActions.sendMotorPosition(name, option.target.value);
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
                    <input type="number" min="0.0" max="2.0" step="0.1" defaultValue={this.props.sampleViewState.motors.BackLight.position} onChange={this.setLigthStrengthBack} />
                </button>
                <button type="button" data-toggle="tooltip"  title="Frontlight On/Off" className="btn btn-link pull-center light-button">
                    <i id="front-light-icon" className={"fa fa-2x fa-fw fa fa-lightbulb-o" + (this.props.sampleViewState.lightOn.front ? " button-active" : "")} onClick={this.toogleFrontLight}></i>
                    <input type="number" min="0.0" max="2.0" step="0.1" defaultValue={this.props.sampleViewState.motors.FrontLight.position} onChange={this.setLigthStrengthFront} />                 
                </button>                                

            </div>
        </div>

        );        
}
}



