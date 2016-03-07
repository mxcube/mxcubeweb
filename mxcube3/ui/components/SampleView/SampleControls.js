'use strict';
import './SampleView.css';
import React from 'react'

export default class SampleControls extends React.Component {

zoomIn(){
  if(this.props.sampleViewState.zoom < 9){
      this.props.sampleActions.sendZoomPos(this.props.sampleViewState.zoom + 1);
  }
}

zoomOut(){
   if(this.props.sampleViewState.zoom > 0){
      this.props.sampleActions.sendZoomPos(this.props.sampleViewState.zoom - 1);
  }
}

takeSnapShot(){
  document.getElementById("downloadLink").href = this.state.canvas.toDataURL();
}

lightOnOff(){
  (this.state.lightOn ? this.props.sampleActions.sendLightOn() : this.props.sampleActions.sendLightOff())
  this.setState({lightOn: !this.state.lightOn});
}



render() {
    return (
        <div className="sample-controlls">
            <div className="text-center"> 
                <button type="button" data-toggle="tooltip"  title="Measure distance" className="btn btn-link  pull-center"><i className="fa fa-2x fa-fw fa-calculator"></i></button>                              
                <a href="#" id="downloadLink" type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={() => this.takeSnapShot()} download><i className="fa fa-2x fa-fw fa-camera"></i></a>                            
                <button type="button" data-toggle="tooltip"  title="Start auto centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendStartAutoCentring}><i className="fa fa-2x fa-fw fa-arrows"></i></button>
                <button type="button" data-toggle="tooltip"  title="Start 3-click centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendStartClickCentring}><i className="fa fa-2x fa-fw fa-circle-o-notch"></i></button>
                <button type="button" data-toggle="tooltip"  title="Abort Centring" className="btn btn-link  pull-center" onClick={this.props.sampleActions.sendAbortCentring}><i className="fa fa-2x fa-fw fa-times"></i></button>
                <button type="button" data-toggle="tooltip"  title="Zoom in" className="btn btn-link  pull-center" onClick={() => this.zoomIn()}><i className="fa fa-2x fa-fw fa fa-search-plus"></i></button>
                <button type="button" data-toggle="tooltip"  title="Zoom out" className="btn btn-link  pull-center" onClick={() => this.zoomOut()}><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>
                <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={() => this.lightOnOff()}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
            </div>
        </div>

        );        
}
}



