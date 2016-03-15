'use strict';
import './SampleView.css';
import React from 'react'

export default class SampleControls extends React.Component {

    constructor(props) {
        super(props);
        this.takeSnapShot = this.takeSnapShot.bind(this);
        this.setZoom = this.setZoom.bind(this);
        this.setLigthStrength = this.setLigthStrength.bind(this);
    }



    setZoom(option){
        this.props.sampleActions.sendZoomPos(option.target.value);
    }

    takeSnapShot(){
        document.getElementById("downloadLink").href = this.state.canvas.toDataURL();
    }


    setLigthStrength(option){
        this.props.sampleActions.sendMotorPosition("BackLight", option.target.value);
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
                <button type="button" data-toggle="tooltip"  title="Zoom out" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>
                <input className="bar" type="range" id="zoom-control" min="0" max="9" step="1" defaultValue={this.props.sampleViewState.zoom} onChange={this.setZoom}/>
                <button type="button" data-toggle="tooltip"  title="Zoom in" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa fa-search-plus"></i></button>
                <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendBackLightOff}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
                <input className="bar" type="range" id="light-control" min="0.0" max="2.0" step="0.1" defaultValue={this.props.sampleViewState.motors.BackLight.position} onChange={this.setLigthStrength} />
                <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendBackLightOn}><i className="fa fa-2x fa-fw fa fa-lightbulb-o light-on"></i> </button>

            </div>
        </div>

        );        
}
}



