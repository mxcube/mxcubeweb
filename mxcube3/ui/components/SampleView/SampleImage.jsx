'use strict';
import './SampleView.css';
import React, { Component, PropTypes } from 'react'


export default class MXNavbar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      clickCentring: false,
      pointsCollected : 0,
      canvas: {},
      centringPoint: null,
      points: []
    };
  }

  componentDidMount(){

      // Set size of canvas depending on image ratio and screen size
      this.drawCanvas();

      // Create fabric and set image background to sample
      var canvas = new fabric.Canvas('canvas');
      this.drawSampleImage(canvas);

      // Bind leftClick to function
      canvas.on('mouse:down', (option) => this.leftClick(option, canvas));

      // Bind rigth click to functions, this is not supported by fabric.js and has to be added manually with javascript
      document.getElementById('insideWrapper').addEventListener('contextmenu', (e) => this.rightClick(e,canvas), false);

      //Bind canvas to state, this is done to let other functions manipulate the canvas such as removing objecs
      this.setState({canvas: canvas});

    }

    drawCanvas(){
      var w = document.getElementById('outsideWrapper').clientWidth;
      var h = w/1.34;
      var canvasWindow = document.getElementById('canvas');
      canvasWindow.width = w;
      canvasWindow.height = h;

    }

    drawSampleImage(canvas){
     canvas.setBackgroundImage('/mxcube/api/v0.1/sampleview/camera/subscribe', canvas.renderAll.bind(canvas), {
      width: canvas.width,
      height: canvas.height,
      originX: 'left',
      originY: 'top'
    });

     var circle = new fabric.Circle({
      radius: 40,
      fill: '',
      strokeWidth: 3, 
      stroke: 'blue',
      left: canvas.width/2 - 40,
      top: canvas.height/2 - 40 ,
      selectable: false

    });

     var line1 = this.makeLine([ 20, canvas.height-25, 20, canvas.height -100 ]);
     var line2 = this.makeLine([ 25,  canvas.height-20, 100, canvas.height-20 ]);

     var text1 = new fabric.Text('100 um', { left: 27, top: canvas.height -100, fill: 'green', stroke: 'green', fontSize: 18, selectable: false});
     var text2 = new fabric.Text('100 um', { left: 45, top: canvas.height-40, fill: 'green', stroke: 'green', fontSize: 18, selectable: false});

     canvas.add(line1, line2, text1, text2, circle);

     this.setState({text1: text1,text2: text2 ,circle: circle});

   }

   startClickCentring(){
    this.setState({clickCentring: true});
    this.props.sampleActions.sendStartClickCentring();
  }

  removeObject(){
    this.state.canvas.getActiveObject().remove();
    document.getElementById("contextMenu").style.display = "none";
  }

  rightClick(e, canvas){
   document.getElementById("contextMenu").style.display = "none";
   var objectFound = false;
   var clickPoint = new fabric.Point(e.offsetX, e.offsetY);
   e.preventDefault();
   canvas.forEachObject(function (obj) {
    if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
      objectFound = true;
      canvas.setActiveObject(obj);
      document.getElementById("contextMenu").style.display = "block";
      document.getElementById("contextMenu").style.top = e.offsetY + "px";
      document.getElementById("contextMenu").style.left = e.offsetX + "px";
    }
  });
 }


 leftClick(option, canvas){
  document.getElementById("contextMenu").style.display = "none";
  let pointsCollected = this.state.pointsCollected;
  let clickCentring = this.state.clickCentring;
  if(pointsCollected < 3 && clickCentring){
    (this.state.centringPoint ? this.state.centringPoint.remove(): '');
    let circle = this.makeCircle(option.e.layerX - 5, option.e.layerY - 5);
    canvas.add(circle);
    this.props.sampleActions.sendCentringPoint(option.e.layerX, option.e.layerY);
    this.setState({pointsCollected: ++pointsCollected, centringPoint: circle});
  }else{
    this.setState({
      pointsCollected: 0,
      clickCentring: false
    });
  }

}
makeCircle(x, y, color = "red") {
  return new fabric.Circle({
    radius: 5, 
    strokeWidth: 2, 
    stroke: color,
    fill: '',
    left: x,
    top: y,
    selectable: true,
    lockMovementX: true,
    lockMovementX: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,

  });
}

makeLine(coords) {
  return new fabric.Line(coords, {
    fill: 'green',
    stroke: 'green',
    strokeWidth: 5,
    selectable: false
  });
}


showModal(modalName){
  this.props.showForm(modalName, true);
  document.getElementById("contextMenu").style.display = "none";
}

clearPoints(){

}

savePoint(){
  let point = this.makeCircle(this.state.centringPoint.left, this.state.centringPoint.top, "green");
  this.state.canvas.add(point);
  this.state.points.push(point);
  this.state.centringPoint.remove();
  document.getElementById("contextMenu").style.display = "none";
  this.props.sampleActions.sendSavePoint();

}

zoomIn(){
  this.state.text1.text = "200 um";
  this.state.text2.text = "200 um";
  this.state.canvas.renderAll();
}

zoomOut(){
  this.state.text1.text = "50 um";
  this.state.text2.text = "50 um";
  this.state.canvas.renderAll();
}


  render() {

    return (
                <div>
                  <div className="outsideWrapper" id="outsideWrapper">
                    <div className="insideWrapper" id="insideWrapper">
                      <ul id="contextMenu" className="dropdown-menu contextMenu" role="menu" >
                          <li><a onClick={() => this.showModal("characterisation")}>Add Characterisation</a></li>
                          <li><a onClick={() => this.showModal("datacollection")}>Add Datacollection</a></li>
                          <hr />
                          <li><a onClick={() => this.savePoint()}>Save Point</a></li>
                          <li><a onClick={() => this.removeObject()}>Delete Point</a></li>
                      </ul>
                      <canvas id="canvas" className="coveringCanvas" />
                    </div>
                    <div className="sample-controlls">
                            <button type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={() => this.savePoint()}><i className="fa fa-2x fa-fw fa-save"></i></button>                            
                            <button type="button" data-toggle="tooltip"  title="Measure distance" className="btn btn-link  pull-center" onClick={this.measureDistance}><i className="fa fa-2x fa-fw fa-calculator"></i></button>                              
                            <button type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={() => this.props.sampleActions.sendTakeSnapShot()}><i className="fa fa-2x fa-fw fa-camera"></i></button>                            
                            <button type="button" data-toggle="tooltip"  title="Start auto centring" className="btn btn-link  pull-center" onClick={() => this.props.sampleActions.sendStartAutoCentring()}><i className="fa fa-2x fa-fw fa-arrows"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Start 3-click centring" className="btn btn-link  pull-center" onClick={() => this.startClickCentring()}><i className="fa fa-2x fa-fw fa-circle-o-notch"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Clear points" className="btn btn-link  pull-center" onClick={() => this.clearPoints()}><i className="fa fa-2x fa-fw fa-times"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Zoom in" className="btn btn-link  pull-center" onClick={() => this.zoomIn()}><i className="fa fa-2x fa-fw fa fa-search-plus"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Zoom out" className="btn btn-link  pull-center" onClick={() => this.zoomOut()}><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={this.lightOnOff}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
                    </div>
                </div>
              

              </div>
            );        
  }
}



