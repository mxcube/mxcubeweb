'use strict';
import './SampleView.css';
import React from 'react';
import { makeCircle, makeLine, makeBeam, makeText } from './shapes';
import 'fabric';
var fabric = window['fabric'];

export default class SampleImage extends React.Component {

  constructor(props) {
    super(props);
    this.setImageRatio = this.setImageRatio.bind(this);
  }

  componentDidMount() {
        // Create fabric and set image background to sample
        var canvas = new fabric.Canvas('canvas');

        // Bind leftClick to function
        canvas.on('mouse:down', (option) => this.leftClick(option));

        // Bind rigthclick to functions, this is not supported by fabric.js and has to be added manually with javascript
        document.getElementById('insideWrapper').addEventListener('contextmenu', (e) => this.rightClick(e,canvas), false);

        //Add so that the canvas will resize if the window changes size
        window.addEventListener('resize', this.setImageRatio);
        this.setImageRatio();

        //Bind canvas to state, this is done to let other functions manipulate the canvas such as removing objecs
        this.props.sampleActions.setCanvas(canvas);
    }

    componentWillUnmount() {
        // Important to remove listener if component isn't active
        window.removeEventListener('resize', this.setImageRatio);
    }
    

    componentWillReceiveProps(nextProps){
        this.renderSampleView(nextProps);
    }

    setImageRatio(){
        const ratioWidthHeigth = this.props.imageWidth/this.props.imageHeight;
        var w = document.getElementById('outsideWrapper').clientWidth;
        let imageRatio = this.props.imageWidth/w;
        this.props.sampleActions.setImageRatio(imageRatio);
    }

    renderSampleView(nextProps){
        this.drawCanvas(nextProps.canvas, nextProps.imageRatio);
        this.renderPoints(nextProps.shapeList, nextProps.canvas, nextProps.imageRatio);
        this.drawImageOverlay(nextProps.canvas, nextProps.imageRatio, nextProps.currentAperture);

    }

    drawCanvas(canvas, imageRatio){
        //Getting the size of screen
        var w = this.props.imageWidth / imageRatio;
        var h = this.props.imageHeight / imageRatio;

        //Set the size of the original html Canvas
        var canvasWindow = document.getElementById('canvas');
        canvasWindow.width = w;
        canvasWindow.height = h;

        //Set the size of the created FabricJS Canvas
        canvas.setDimensions({width: w, height: h});
        canvas.renderAll();
        canvas.clear();

        //Set size of the Image from MD2
        document.getElementById("sample-img").style.height = h + "px";
        document.getElementById("sample-img").style.width = w + "px";
        document.getElementById("insideWrapper").style.height = h + "px";
  }

  drawImageOverlay(canvas, imageRatio, currentAperture) {
    let apertureDiameter = currentAperture * 0.001 * this.props.pixelsPerMm / imageRatio;
    let scaleLength = 0.05 * this.props.pixelsPerMm / imageRatio;
    canvas.add(makeBeam(canvas.width / 2, canvas.height / 2, apertureDiameter / 2));
    canvas.add(makeLine(10, canvas.height - 10, scaleLength + 10, canvas.height - 10));
    canvas.add(makeLine(10, canvas.height - 10, 10, canvas.height - 10 - scaleLength));
    canvas.add(makeText(20, canvas.height - 30, 16));
  }

  rightClick(e, canvas) {
    if(this.props.contextMenuShow){
        this.props.sampleActions.showContextMenu(false);
    }        
    var objectFound = false;
    var clickPoint = new fabric.Point(e.offsetX, e.offsetY);
    e.preventDefault();
    canvas.forEachObject((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = true;
          this.props.sampleActions.showContextMenu(true, obj, e.offsetX, e.offsetY);
        }
    });
  }

  leftClick(option) {
    if (this.props.contextMenuShow) {
      this.props.sampleActions.showContextMenu(false);
    }

    if (this.props.clickCentring) {
      this.props.sampleActions.sendCentringPoint(option.e.layerX * this.props.imageRatio, option.e.layerY * this.props.imageRatio);
    }
  }

  renderPoints(points, canvas, imageRatio){ 
    for(let id in points){
      switch (points[id].type){
        case "SAVED":
          canvas.add(makeCircle(points[id].x / imageRatio, points[id].y / imageRatio, id,  "green", "SAVED"));
          break;
        case "TMP":
          canvas.add(makeCircle(points[id].x / imageRatio, points[id].y / imageRatio, id,  "grey", "TMP"));
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
                <img id= "sample-img" className="img" src="/mxcube/api/v0.1/sampleview/camera/subscribe" alt="" />
                <canvas id="canvas" className="coveringCanvas" />
            </div>
        </div>
        );
  }
}



