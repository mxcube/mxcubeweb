'use strict';
import './SampleView.css';
import React, { Component, PropTypes } from 'react'


export default class MXNavbar extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        clickCentring: false,
        pointsCollected : 0,
        canvas: {}
      };
    }

    componentDidMount(){

      // Set size of canvas depending on image ratio and screen size
      var w = document.getElementById('outsideWrapper').clientWidth;
      var h = w/1.34;
      var canvasWindow = document.getElementById('canvas');
      canvasWindow.width = w;
      canvasWindow.height = h;

      // Create fabric and set image background to sample
      var canvas = new fabric.Canvas('canvas');
      canvas.setBackgroundImage('/mxcube/api/v0.1/sampleview/camera/subscribe', canvas.renderAll.bind(canvas), {
        width: canvas.width,
        height: canvas.height,
        originX: 'left',
        originY: 'top'
      });

      // Bind functions to events
      canvas.on('mouse:down', (option) => this.drawCircle(option, canvas));

      // Bind contextMenu to rigth click, this is not supported by fabric.js and has to be added manually
      document.getElementById('outsideWrapper').addEventListener('contextmenu', (e) => this.contextMenu(e,canvas), false);

      //Bind canvas to state, this is done to let other functions manipulate the canvas such as removing objecs
      this.setState({canvas: canvas});

    }

    contextMenu(e, canvas){
       document.getElementById("contextMenu").style.display = "none";
       var objectFound = false;
       var clickPoint = new fabric.Point(e.offsetX, e.offsetY);
    
       e.preventDefault();
       canvas.forEachObject(function (obj) {
        if (!objectFound && obj.containsPoint(clickPoint)) {
          objectFound = true;
          canvas.setActiveObject(obj);
          document.getElementById("contextMenu").style.display = "block";
          document.getElementById("contextMenu").style.top = e.offsetY + "px";
          document.getElementById("contextMenu").style.left = e.offsetX + "px";
          }
        });
    }

    startClickCentring(){
      this.setState({clickCentring: true});
      this.props.sampleActions.SendStartClickCentring();
    }

  removeObject(){
    this.state.canvas.getActiveObject().remove();
    document.getElementById("contextMenu").style.display = "none";
  }


  drawCircle(option, canvas){
    document.getElementById("contextMenu").style.display = "none";
    let pointsCollected = this.state.pointsCollected;
    let clickCentring = this.state.clickCentring;
    if(pointsCollected < 3 && clickCentring){
        canvas.clear();
        var circle = new fabric.Circle({
          radius: 5, 
          fill: 'red', 
          left: option.e.layerX - 5,
          top: option.e.layerY - 5 ,
          selectable: true,
          lockMovementX: true,
          lockMovementX: true,
          lockScalingFlip: true,
          lockScalingX: true,
          lockScalingY: true

        });
      canvas.add(circle);

      this.setState({pointsCollected: ++pointsCollected});
    }else{
      this.setState({
        pointsCollected: 0,
        clickCentring: false
      });
    }

}
 

  showModal(modalName){
    this.props.showForm(modalName, true);
     document.getElementById("contextMenu").style.display = "none";
  }


  render() {

    return (
                <div>
                  <div className="outsideWrapper" id="outsideWrapper">
                    <div className="insideWrapper">
                      <ul id="contextMenu" className="dropdown-menu contextMenu" role="menu" >
                          <li><a onClick={() => this.showModal("characterisation")}>Add Characterisation</a></li>
                          <li><a onClick={() => this.showModal("datacollection")}>Add Datacollection</a></li>
                          <li><a onClick={() => this.removeObject()}>Delete Point</a></li>
                      </ul>
                      <canvas id="canvas" className="coveringCanvas" />
                    </div>
                </div>
                <hr />
                <div className="panel panel-info">
                        <div className="panel-heading">
                            <h3 className="panel-title">Controls</h3>
                        </div>
                        <div className="panel-body">
                            <button type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={this.takeSnapshot}><i className="fa fa-2x fa-fw fa-save"></i></button>                            
                            <button type="button" data-toggle="tooltip"  title="Measure distance" className="btn btn-link  pull-center" onClick={this.measureDistance}><i className="fa fa-2x fa-fw fa-calculator"></i></button>                              
                            <button type="button" data-toggle="tooltip"  title="nothing..." className="btn btn-link  pull-center" onClick={this.aMethod}><i className="fa fa-2x fa-fw fa-arrows-v"></i></button>                            
                            <button type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={this.takeSnapshot}><i className="fa fa-2x fa-fw fa-camera"></i></button>                            
                            <button type="button" data-toggle="tooltip"  title="Start auto centring" className="btn btn-link  pull-center" onClick={() => this.startCentring()}><i className="fa fa-2x fa-fw fa-arrows"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Start 3-click centring" className="btn btn-link  pull-center" onClick={() => this.startClickCentring()}><i className="fa fa-2x fa-fw fa-circle-o-notch"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Clear points" className="btn btn-link  pull-center" onClick={this.deletePoints}><i className="fa fa-2x fa-fw fa-times"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Zoom in" className="btn btn-link  pull-center" onClick={this.zoomIn}><i className="fa fa-2x fa-fw fa fa-search-plus"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Zoom out" className="btn btn-link  pull-center" onClick={this.zoomOut}><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.lightOnOff}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
                            <div className="input-group">
                              <span className="input-group-addon" id="basic-addon1">Kappa   </span>
                              <input type="number"  id="Kappa" step="0.01" min='0' max='360'  className="form-control" placeholder="kappa" aria-describedby="basic-addon1" onKeyPress={this.isNumberKey} onkeyup={this.isNumberKey}/>
                              <span className="input-group-addon" id="basic-addon2">Omega   </span>
                              <input type="number"   id="Omega" step="0.01" min='0' max='360'  className="form-control" placeholder="omega" aria-describedby="basic-addon2" intermediateChanges='true' onKeyPress={this.isNumberKey}/>
                              <span className="input-group-addon" id="basic-addon3">Phi   </span>
                              <input type="number"  id="Phi" step="0.01" min='0' max='360'   className="form-control" placeholder="Phi" aria-describedby="basic-addon3" onKeyPress={this.isNumberKey}/>
                            </div>
                        </div>
                    </div>


              </div>
            );        
  }
}



