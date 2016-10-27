import './SampleView.css';
import React from 'react';
import { makePoints, makeLines, makeImageOverlay } from './shapes';
import SampleControls from './SampleControls';
import 'fabric';
const fabric = window.fabric;

export default class SampleImage extends React.Component {

  constructor(props) {
    super(props);
    this.setImageRatio = this.setImageRatio.bind(this);
    this.setColorPoint = this.setColorPoint.bind(this);
    this.canvas = {};
    this.state = { keyPressed: null };
  }

  componentDidMount() {
    // Create fabric and set image background to sample
    this.canvas = new fabric.Canvas('canvas', { defaultCursor: 'crosshair' });

    // Bind leftClick to function
    this.canvas.on('mouse:down', (option) => this.leftClick(option));

    // Render color of points
    this.canvas.on('before:selection:cleared', (o) => this.setColorPoint(o, false));
    this.canvas.on('object:selected', (o) => this.setColorPoint(o, true));
    this.canvas.on('selection:cleared', (o) => this.setColorPoint(o, false));

    // Bind rigthclick to function manually with javascript
    const imageOverlay = document.getElementById('insideWrapper');
    imageOverlay.addEventListener('contextmenu', (e) => this.rightClick(e), false);
    // Bind mouse scroll up/down to function manually with javascript
    imageOverlay.addEventListener('wheel', (e) => this.wheel(e), false);
    // Bind mouse double click to function manually with javascript
    imageOverlay.addEventListener('dblclick', (e) => this.goToBeam(e), false);

    this.setImageRatio();

    // Add so that the canvas will resize if the window changes size
    window.addEventListener('resize', this.setImageRatio);
    document.addEventListener('keydown', (event) => {
      if (!this.state.keyPressed) {
        this.setState({ keyPressed: event.key });
      }
    }, false);

    document.addEventListener('keyup', () => {
      this.setState({ keyPressed: null });
    }, false);
  }

  componentWillReceiveProps(nextProps) {
    const { width, cinema } = this.props;
    if (nextProps.width !== width || nextProps.cinema !== cinema) {
      this.setImageRatio();
    }
    this.renderSampleView(nextProps);
  }

  componentWillUnmount() {
    // Important to remove listener if component isn't active
    window.removeEventListener('resize', this.setImageRatio);
  }

  setColorPoint(o, selection) {
    const shape = o.target;
    if (shape && shape.type === 'group') {
      shape.hasBorders = false;
      shape.hasControls = false;
      shape.forEachObject((p) => {
        const point = p;
        if (point.type === 'SAVED' || point.type === 'LINE') {
          const color = selection ? '#88ff5b' : point.defaultColor;
          const width = selection ? 4 : 2;
          point.stroke = color;
          point.text.stroke = color;
          point.text.fill = color;
          point.strokeWidth = width;
        }
      });
    } else if (shape && shape.text) {
      this.canvas.getObjects('SAVED').concat(
      this.canvas.getObjects('LINE')).forEach((p) => {
        const point = p;
        const color = point.active ? '#88ff5b' : point.defaultColor;
        const width = point.active ? 4 : 2;
        point.stroke = color;
        point.text.stroke = color;
        point.text.fill = color;
        point.hasControls = false;
        point.strokeWidth = width;
      });
    }
  }

  setImageRatio() {
    this.props.sampleActions.setImageRatio(document.getElementById('outsideWrapper').clientWidth);
  }
  goToBeam(e) {
    const { sampleActions, imageRatio } = this.props;
    const { sendGoToBeam } = sampleActions;
    sendGoToBeam(e.layerX * imageRatio, e.layerY * imageRatio);
  }

  drawCanvas(imageRatio) {
    // Getting the size of screen
    const { width, height } = this.props;
    const w = width / imageRatio;
    const h = height / imageRatio;
    // Set the size of the original html Canvas
    const canvasWindow = document.getElementById('canvas');
    canvasWindow.width = w;
    canvasWindow.height = h;
    // Set the size of the created FabricJS Canvas
    this.canvas.setDimensions({ width: w, height: h });
    this.canvas.renderAll();
    this.canvas.clear();

    // Set size of the Image from MD2
    document.getElementById('sample-img').style.height = `${h}px`;
    document.getElementById('sample-img').style.width = `${w}px`;
    document.getElementById('insideWrapper').style.height = `${h}px`;
  }


  rightClick(e) {
    const group = this.canvas.getActiveGroup();
    const { sampleActions } = this.props;
    const { showContextMenu } = sampleActions;
    let objectFound = false;
    const clickPoint = new fabric.Point(e.offsetX, e.offsetY);
    e.preventDefault();

    this.canvas.forEachObject((obj) => {
      if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
        objectFound = true;
        this.canvas.setActiveObject(obj);
        showContextMenu(true, obj, obj.left, obj.top);
      }
    });

    if (group && group.containsPoint(clickPoint)) {
      const points = group.getObjects();
      this.canvas.discardActiveGroup();

      group.getObjects().forEach((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = true;
        }
      });

      if (objectFound) {
        group.getObjects().forEach((obj) => {
          const shape = obj;
          shape.active = true;
        });
        this.canvas.setActiveGroup(
          new fabric.Group(
            group.getObjects(),
            { originX: 'center',
            originY: 'center' }
        ));
        showContextMenu(true, {
          type: 'GROUP',
          id: {
            p1: points[0].id,
            p2: points[1].id
          }
        },
        e.offsetX, e.offsetY);
      }
    }

    if (!objectFound) {
      this.canvas.discardActiveGroup();
      showContextMenu(true, { type: 'NONE' }, e.offsetX, e.offsetY);
    }
  }

  leftClick(option) {
    this.canvas.discardActiveGroup();
    let objectFound = false;
    if (option.target && option.target.type === 'group') {
      const clickPoint = new fabric.Point(option.e.offsetX, option.e.offsetY);
      option.target.getObjects().forEach((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = true;
        }
      });
    }
    if (objectFound) {
      option.target.getObjects().forEach((obj) => {
        const shape = obj;
        shape.active = true;
      });
      this.canvas.setActiveGroup(
        new fabric.Group(
          option.target.getObjects(),
          { originX: 'center',
          originY: 'center' }
      ));
    }

    const {
      sampleActions,
      clickCentring,
      measureDistance,
      imageRatio,
      contextMenuVisible
    } = this.props;
    if (contextMenuVisible) {
      sampleActions.showContextMenu(false);
    }
    if (clickCentring) {
      sampleActions.sendCentringPoint(option.e.layerX * imageRatio, option.e.layerY * imageRatio);
    } else if (measureDistance) {
      sampleActions.addDistancePoint(option.e.layerX * imageRatio, option.e.layerY * imageRatio);
    }
  }

  wheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const { sampleActions, motorSteps, zoom, motors } = this.props;
    const { sendMotorPosition, sendZoomPos } = sampleActions;
    const keyPressed = this.state.keyPressed;
    if (keyPressed === 'r' && motors.phi.Status === 2) {
      // then we rotate phi axis by the step size defined in its box
      if (e.deltaX > 0 || e.deltaY > 0) {
        // zoom in
        sendMotorPosition('Phi', motors.phi.position + parseInt(motorSteps.phiStep, 10));
      } else if (e.deltaX < 0 || e.deltaY < 0) {
        // zoom out
        sendMotorPosition('Phi', motors.phi.position - parseInt(motorSteps.phiStep, 10));
      }
    } else if (keyPressed === 'f' && motors.focus.Status === 2) {
      if (e.deltaY > 0) {
        // Focus in
        sendMotorPosition('Focus', motors.focus.position + parseFloat(motorSteps.focusStep, 10));
      } else if (e.deltaY < 0) {
        // Focus out
        sendMotorPosition('Focus', motors.focus.position - parseFloat(motorSteps.focusStep, 10));
      }
    } else if (keyPressed === 'z' && motors.zoom.Status === 2) {
      // in this case zooming
      if (e.deltaY > 0 && zoom < 10) {
        // zoom in
        sendZoomPos(zoom + 1);
      } else if (e.deltaY < 0 && zoom > 1) {
        // zoom out
        sendZoomPos(zoom - 1);
      }
    }
  }

  renderSampleView(nextProps) {
    const group = this.canvas.getActiveGroup();
    const selection = this.canvas.getActiveObject();
    const {
      imageRatio,
      beamPosition,
      beamShape,
      beamSize,
      clickCentringPoints,
      distancePoints,
      points,
      lines,
      pixelsPerMm
    } = nextProps;
    this.drawCanvas(imageRatio);
    this.canvas.add(...makeImageOverlay(
      imageRatio,
      pixelsPerMm,
      beamPosition,
      beamShape,
      beamSize,
      clickCentringPoints,
      distancePoints,
      this.canvas
    ));
    const fabricSelectables = [
      ...makePoints(points, imageRatio),
      ...makeLines(lines, points, imageRatio)
    ];
    this.canvas.add(...fabricSelectables);
    if (group) {
      const groupIDs = group.getObjects().map((shape) => shape.id);
      const selectedShapes = [];
      fabricSelectables.forEach((obj) => {
        const shape = obj;
        if (groupIDs.includes(shape.id)) {
          selectedShapes.push(shape);
          this.setColorPoint(shape);
          shape.active = true;
        }
      });
      this.canvas.setActiveGroup(
        new fabric.Group(
          selectedShapes,
          {
            originX: 'center',
            originY: 'center'
          })
      );
    } else if (selection) {
      fabricSelectables.forEach((shape) => {
        if (shape.id === selection.id) {
          this.canvas.setActiveObject(shape);
          this.setColorPoint(shape);
        }
      });
    }
    this.canvas.renderAll();
  }


  render() {
    return (
      <div>
        <div className="outsideWrapper" id="outsideWrapper">
          <div className="insideWrapper" id="insideWrapper">
            <SampleControls
              {...this.props}
              canvas={this.canvas}
            />
            <img
              id= "sample-img"
              className="img"
              src="/mxcube/api/v0.1/sampleview/camera/subscribe"
              alt="SampleView"
            />
            <canvas id="canvas" className="coveringCanvas" />
          </div>
        </div>
      </div>
    );
  }
}
