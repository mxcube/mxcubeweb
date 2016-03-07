'use strict';
import './SampleView.css';
import React from 'react'
import {makeCircle, makeLine} from './shapes'

export default class SampleImage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      canvas: {},
      group: null
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
      this.renderPoints(this.props.shapeList, canvas);

  }

componentWillReceiveProps(nextProps){
    this.renderPoints(nextProps.shapeList, this.state.canvas);
}

  drawCanvas(canvas){

    const ratioWidthHeigth = this.props.imageWidth/this.props.imageHeight;

      //Getting the size of screen
      var w = document.getElementById('outsideWrapper').clientWidth;
      var h = w/ratioWidthHeigth;

      //Canvas
      var canvasWindow = document.getElementById('canvas');
      canvasWindow.width = w;
      canvasWindow.height = h;

      //FabricJS
      canvas.setDimensions({width: w, height: h});
      canvas.renderAll();

      //Image from MD2
      document.getElementById("sample-img").style.height = h + "px";
      document.getElementById("sample-img").style.width = w + "px";
      document.getElementById("insideWrapper").style.height = h + "px";

      this.setState({heightRatio: this.props.imageHeight/h, widthRatio: this.props.imageWidth/w});


  }

rightClick(e, canvas){
     this.props.sampleActions.showContextMenu(false);
     var objectFound = false;
     var clickPoint = new fabric.Point(e.offsetX, e.offsetY);
     e.preventDefault();
     canvas.forEachObject((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = true;
          canvas.setActiveObject(obj);
          this.props.sampleActions.showContextMenu(true, obj, e.offsetX, e.offsetY);

      }
  });

     if(this.state.group && this.state.group.containsPoint(clickPoint)){
        this.props.sampleActions.showContextMenu(true, obj, e.offsetX, e.offsetY);
    }
}

leftClick(option){

    if(this.props.contextMenuShow){
        this.props.sampleActions.showContextMenu(false);
    }
    
    if(this.props.clickCentring){
        this.props.sampleActions.sendCentringPoint(option.e.layerX * this.state.widthRatio, option.e.layerY  * this.state.heightRatio);
    }
}

drawLine(){
    this.props.sampleActions.showContextMenu(false);
    let points = this.state.group.getObjects();
    this.state.canvas.add(makeLine(points[0], points[1]));
}

renderPoints(points, canvas){    
    canvas.clear();
    let heightRatio = canvas.height/this.props.imageHeight;
    let widthRatio = canvas.width/this.props.imageWidth;

    for(let id in points){
      switch (points[id].type){
        case "SAVED":
          canvas.add(makeCircle(points[id].x * widthRatio, points[id].y * heightRatio, id,  "green", "SAVED"));
          break;
        case "TMP":
          canvas.add(makeCircle(points[id].x * widthRatio, points[id].y * heightRatio, id,  "grey", "TMP"));
          break;
        default:
          throw new Error("Server gave point with unknown type"); 
      }
    } 
}


  render() {
    return (
        <div className="outsideWrapper" id="outsideWrapper">
            <div className="insideWrapper" id="insideWrapper">
                <img id= "sample-img" className='img' src="/mxcube/api/v0.1/sampleview/camera/subscribe" alt="" />
                <canvas id="canvas" className="coveringCanvas" />
            </div>
        </div>
        );        
  }
}



