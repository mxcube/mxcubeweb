'use strict';
import './SampleView.css';
import React from 'react'
import {makeCircle, makeLine, makeBeam, makeText} from './shapes'

export default class SampleImage extends React.Component {

    componentDidMount(){
        // Create fabric and set image background to sample
        var canvas = new fabric.Canvas('canvas');

        // Bind leftClick to function
        canvas.on('mouse:down', (option) => this.leftClick(option));

          // Bind rigth click to functions, this is not supported by fabric.js and has to be added manually with javascript
        document.getElementById('insideWrapper').addEventListener('contextmenu', (e) => this.rightClick(e,canvas), false);

        //Bind canvas to state, this is done to let other functions manipulate the canvas such as removing objecs
        this.props.sampleActions.setCanvas(canvas);

        // Draw canvas and set img size depending on screen size
        let imageRatio = this.drawCanvas(canvas);
        this.renderPoints(this.props.shapeList, canvas, imageRatio);
        this.drawImageOverlay(canvas, imageRatio);

        window.addEventListener('resize', () => this.drawCanvas(canvas));

    }

    componentWillReceiveProps(nextProps){
        this.renderPoints(nextProps.shapeList, nextProps.canvas, nextProps.imageRatio);
        this.drawImageOverlay(nextProps.canvas, nextProps.imageRatio);
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

        let imageRatio = this.props.imageHeight/h;
        this.props.sampleActions.setImageRatio(imageRatio);

        return imageRatio;
    }

    drawImageOverlay(canvas, imageRatio){
        let l = 0.05 * this.props.pixelsPerMm / imageRatio;
        canvas.add(makeBeam(canvas.width/2,canvas.height/2, l/2));
        canvas.add(makeLine(10,canvas.height-10,l + 10,canvas.height-10));
        canvas.add(makeLine(10,canvas.height-10,10,canvas.height-10-l));
        canvas.add(makeText(20,canvas.height-30,16));
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
    }

    leftClick(option){
        if(this.props.contextMenuShow){
            this.props.sampleActions.showContextMenu(false);
        }
        
        if(this.props.clickCentring){
            this.props.sampleActions.sendCentringPoint(option.e.layerX * this.props.imageRatio, option.e.layerY  * this.props.imageRatio);
        }
    }



    renderPoints(points, canvas, imageRatio){ 
        canvas.clear();
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
                <img id= "sample-img" className='img' src="/mxcube/api/v0.1/sampleview/camera/subscribe" alt="" />
                <canvas id="canvas" className="coveringCanvas" />
            </div>
        </div>
        );        
  }
}



