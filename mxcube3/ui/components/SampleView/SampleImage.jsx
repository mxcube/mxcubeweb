import './SampleView.css';
import React from 'react';
import { makeCross, makeBeam, makeScale, makePoint } from './shapes';
import SampleControls from './SampleControls';
import 'fabric';
const fabric = window.fabric;

export default class SampleImage extends React.Component {

  constructor(props) {
    super(props);
    this.setImageRatio = this.setImageRatio.bind(this);
    this.canvas = {};
  }

  componentDidMount() {
    // Create fabric and set image background to sample
    this.canvas = new fabric.Canvas('canvas', { defaultCursor: 'crosshair' });

    // Bind leftClick to function
    this.canvas.on('mouse:down', (option) => this.leftClick(option));

    // Bind rigthclick to function manually with javascript
    document.getElementById('insideWrapper').addEventListener('contextmenu', (e) => this.rightClick(e), false);

    this.setImageRatio();

    // Add so that the canvas will resize if the window changes size
    window.addEventListener('resize', this.setImageRatio);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.imageWidth !== this.props.imageWidth) {
      this.setImageRatio();
    } else {
      this.renderSampleView(nextProps);
    }
  }

  componentWillUnmount() {
    // Important to remove listener if component isn't active
    window.removeEventListener('resize', this.setImageRatio);
  }

  setImageRatio() {
    this.props.sampleActions.setImageRatio(document.getElementById('outsideWrapper').clientWidth);
  }

  renderSampleView(nextProps) {
    const { imageRatio, currentAperture, beamPosition, clickCentringPoints, shapeList } = nextProps;
    this.drawCanvas(imageRatio);
    this.drawImageOverlay(imageRatio, currentAperture, beamPosition, clickCentringPoints);
    this.renderPoints(shapeList, imageRatio);
  }

  drawCanvas(imageRatio) {
    // Getting the size of screen
    const w = this.props.imageWidth / imageRatio;
    const h = this.props.imageHeight / imageRatio;
    // Set the size of the original html Canvas
    const canvasWindow = document.getElementById('canvas');
    canvasWindow.width = w;
    canvasWindow.height = h;

    // Set the size of the created FabricJS Canvas
    this.canvas.setDimensions({ width: w, height: h });
    this.canvas.renderAll();
    this.canvas.clear();

    // Set size of the Image from MD2
    document.getElementById('sample-img').style.height = h + 'px';
    document.getElementById('sample-img').style.width = w + 'px';
    document.getElementById('insideWrapper').style.height = h + 'px';
  }

  drawImageOverlay(imageRatio, currentAperture, beamPosition, clickCentringPoints) {
    const apertureDiameter = currentAperture * 0.001 * this.props.pixelsPerMm / imageRatio;
    const scaleLength = 0.05 * this.props.pixelsPerMm / imageRatio;
    this.canvas.add(...makeBeam(beamPosition[0] / imageRatio, beamPosition[1] / imageRatio, apertureDiameter / 2));
    this.canvas.add(...makeScale(this.canvas.height, scaleLength, 'green', '50 µm'));
    if (clickCentringPoints.length) {
      const point = clickCentringPoints[clickCentringPoints.length - 1];
      this.canvas.add(...makeCross(point, imageRatio, this.canvas.width, this.canvas.height));
    }
  }

  rightClick(e) {
    let objectFound = false;
    const clickPoint = new fabric.Point(e.offsetX, e.offsetY);
    e.preventDefault();
    if (this.props.contextMenuShow) {
      this.props.sampleActions.showContextMenu(false);
    }
    this.canvas.forEachObject((obj) => {
      if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
        objectFound = true;
        this.props.sampleActions.showContextMenu(true, obj, obj.left, obj.top);
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

  renderPoints(points, imageRatio) {
    for (const id in points) {
      switch (points[id].type) {
        case 'SAVED':
          this.canvas.add(...makePoint(points[id].x / imageRatio, points[id].y / imageRatio, id, 'yellow', 'SAVED'));
          break;
        case 'TMP':
          this.canvas.add(...makePoint(points[id].x / imageRatio, points[id].y / imageRatio, id, 'white', 'TMP'));
          break;
        default:
          throw new Error('Server gave point with unknown type');
      }
    }
  }

  render() {
    return (
      <div>
        <div className="outsideWrapper" id="outsideWrapper">
            <div className="insideWrapper" id="insideWrapper">
                <img id= "sample-img" className="img" src="/mxcube/api/v0.1/sampleview/camera/subscribe" alt="SampleView" />
                <canvas id="canvas" className="coveringCanvas" />
            </div>
        </div>
        <SampleControls sampleActions={this.props.sampleActions} sampleViewState={this.props.sampleViewState} canvas={this.canvas} />
      </div>
    );
  }
}
