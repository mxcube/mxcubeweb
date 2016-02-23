'use strict';
import './SampleView.css';
import React from 'react'
import {makeCircle, makeLine} from './shapes'
import ContextMenu from './ContextMenu'

export default class SampleImage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      canvas: {},
      selectedPoint: "NONE",
      group: null,
      lightOn: false,
      showContextMenu: false,
      ContextMenuX: 0,
      ContextMenuY: 0
  };
}

componentDidMount(){

      // Create fabric and set image background to sample
      var canvas = new fabric.Canvas('canvas');

      // Bind leftClick to function
      canvas.on('mouse:down', (option) => this.leftClick(option));

      // Bind rigth click to functions, this is not supported by fabric.js and has to be added manually with javascript
      document.getElementById('insideWrapper').addEventListener('contextmenu', (e) => this.rightClick(e,canvas), false);

      //Bind canvas to state, this is done to let other functions manipulate the canvas such as removing objecs
      this.setState({canvas: canvas});

      //Save and remove group in state
      canvas.on('selection:created', (e) => this.setState({group: e.target}));
      canvas.on('selection:cleared', () => this.setState({group: null}));

      // Draw canvas and set img size depending on screen size
      this.drawCanvas(canvas);

  }

componentWillReceiveProps(nextProps){
    this.renderPoints(nextProps.sampleViewState.points);
}

  drawCanvas(canvas){

      //Getting the size of screen
      var w = document.getElementById('outsideWrapper').clientWidth;
      var h = w/this.props.sampleViewState.ratioWidthHeigth;

      //Canvas
      var canvasWindow = document.getElementById('canvas');
      canvasWindow.width = w;
      canvasWindow.height = h;

      //FabricJS
      canvas.setDimensions({width:w, height: h});
      canvas.renderAll();

      //Image from MD2
      document.getElementById("sample-img").style.height = h + "px";
      document.getElementById("sample-img").style.width = w + "px";
      document.getElementById("insideWrapper").style.height = h + "px";

      this.setState({heightRatio: this.props.sampleViewState.height/h, widthRatio: this.props.sampleViewState.width/w});


  }

rightClick(e, canvas){
     this.setState({showContextMenu: false});
     var objectFound = false;
     var clickPoint = new fabric.Point(e.offsetX, e.offsetY);
     e.preventDefault();
     canvas.forEachObject((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = true;
          canvas.setActiveObject(obj);
          this.setState({showContextMenu: true, selectedPoint: obj.type,ContextMenuX : e.offsetX,ContextMenuY : e.offsetY });

      }
  });

     if(this.state.group && this.state.group.containsPoint(clickPoint)){
        this.setState({showContextMenu: true, selectedPoint: 'GROUP',ContextMenuX : e.offsetX,ContextMenuY : e.offsetY });
    }
}

leftClick(option){

    this.setState({showContextMenu: false});

    if(this.props.sampleViewState.clickCentring){
        this.props.sampleActions.sendCentringPoint(option.e.layerX * this.state.widthRatio, option.e.layerY  * this.state.heightRatio);
    }
}




removeObject(){
    this.props.sampleActions.sendDeletePoint(this.state.canvas.getActiveObject().id);
    this.state.canvas.getActiveObject().remove();
    this.setState({showContextMenu: false});
}

drawLine(){
    let points = this.state.group.getObjects();
    this.state.canvas.add(makeLine(points[0], points[1]));
    this.setState({showContextMenu: false});
}


savePoint(){
    this.props.sampleActions.StopClickCentring();
    this.props.sampleActions.sendSavePoint();
}

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

renderPoints(points){
    
    this.state.canvas.clear();
    let heightRatio = this.state.canvas.height/this.props.sampleViewState.height;
    let widthRatio = this.state.canvas.width/this.props.sampleViewState.width;

    for(let id in points){
        this.state.canvas.add(makeCircle(points[id].x * widthRatio, points[id].y * heightRatio, id,  "", "SAVED"));
    }
}


  render() {

    return (
                <div>
                  <ContextMenu show={this.state.showContextMenu} type={this.state.selectedPoint} x={this.state.ContextMenuX} y={this.state.ContextMenuY} showForm={this.props.showForm} deleteShape={() => this.removeObject()} saveShape={() => this.savePoint()}/>
                  <div className="outsideWrapper" id="outsideWrapper">
                    <div className="insideWrapper" id="insideWrapper">
                      <img id= "sample-img" className='img' src="/mxcube/api/v0.1/sampleview/camera/subscribe" alt="" />
                      <canvas id="canvas" className="coveringCanvas" />
                    </div>
                    <div className="sample-controlls">
                      <div className="text-center"> 
                            <button type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={() => this.savePoint()}><i className="fa fa-2x fa-fw fa-save"></i></button>                            
                            <button type="button" data-toggle="tooltip"  title="Measure distance" className="btn btn-link  pull-center" onClick={() =>  this.props.sampleActions.getPointsPosition()}><i className="fa fa-2x fa-fw fa-calculator"></i></button>                              
                            <a href="#" id="downloadLink" type="button" data-toggle="tooltip"  title="Take snapshot" className="btn btn-link  pull-center" onClick={() => this.takeSnapShot()} download><i className="fa fa-2x fa-fw fa-camera"></i></a>                            
                            <button type="button" data-toggle="tooltip"  title="Start auto centring" className="btn btn-link  pull-center" onClick={() => this.props.sampleActions.sendStartAutoCentring()}><i className="fa fa-2x fa-fw fa-arrows"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Start 3-click centring" className="btn btn-link  pull-center" onClick={() => this.props.sampleActions.sendStartClickCentring()}><i className="fa fa-2x fa-fw fa-circle-o-notch"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Abort Centring" className="btn btn-link  pull-center" onClick={() => this.props.sampleActions.sendAbortCentring()}><i className="fa fa-2x fa-fw fa-times"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Zoom in" className="btn btn-link  pull-center" onClick={() => this.zoomIn()}><i className="fa fa-2x fa-fw fa fa-search-plus"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Zoom out" className="btn btn-link  pull-center" onClick={() => this.zoomOut()}><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>
                            <button type="button" data-toggle="tooltip"  title="Light On/Off" className="btn btn-link  pull-center" onClick={() => this.lightOnOff()}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
                            </div>
                    </div>
                    <div className="sample-controlls">
                            <input type="number" className="camera-controll" id="kappa" placeholder="Kappa" />
                            <input type="number" className="camera-controll" id="omega" placeholder="Omega" />
                            <input type="number" className="camera-controll" id="phi" placeholder="Phi" />
                    </div>
                </div>
              

              </div>
            );        
  }
}



