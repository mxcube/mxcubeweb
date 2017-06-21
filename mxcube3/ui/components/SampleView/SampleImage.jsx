

import './SampleView.css';
import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { makePoints, makeLines, makeImageOverlay } from './shapes';
import DrawGridPlugin from './DrawGridPlugin';
import SampleControls from './SampleControls';

const jsmpeg = require('./jsmpeg.min.js');

import 'fabric';
const fabric = window.fabric;

export default class SampleImage extends React.Component {

  constructor(props) {
    super(props);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.setImageRatio = this.setImageRatio.bind(this);
    this.setColorPoint = this.setColorPoint.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.keyUp = this.keyUp.bind(this);
    this.setHCellSpacing = this.setHCellSpacing.bind(this);
    this.setVCellSpacing = this.setVCellSpacing.bind(this);
    this.gridCellSpacing = this.gridCellSpacing.bind(this);
    this.saveGrid = this.saveGrid.bind(this);
    this.configureGrid = this.configureGrid.bind(this);
    this.selectedGrid = this.selectedGrid.bind(this);
    this.initJSMpeg = this.initJSMpeg.bind(this);
    this.canvas = {};
    this._keyPressed = null;
    this.gridStarted = false;
    this.girdOrigin = null;
    this.lineGroup = null;
    this.drawGridPlugin = new DrawGridPlugin();
    this.player = null;
  }

  componentDidMount() {
    // Create fabric and set image background to sample
    this.canvas = new fabric.Canvas('canvas', { defaultCursor: 'crosshair' });

    // Bind leftClick to function
    this.canvas.on('mouse:down', (option) => this.leftClick(option));
    this.canvas.on('mouse:move', (options) => this.onMouseMove(options));
    this.canvas.on('mouse:up', (options) => this.onMouseUp(options));

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
    document.addEventListener('keydown', this.keyDown, false);
    document.addEventListener('keyup', this.keyUp, false);

    this.initJSMpeg();
  }

  componentWillReceiveProps(nextProps) {
    const { width, cinema } = this.props;
    if (nextProps.width !== width || nextProps.cinema !== cinema ||
        nextProps.autoScale && this.props.imageRatio !== nextProps.imageRatio) {
      this.setImageRatio();
    }
  }

  componentDidUpdate(prevProps) {
    // Initialize JSMpeg for decoding the MPEG1 stream
    if (prevProps.videoFormat !== 'MPEG1') {
      this.initJSMpeg();
    }

    if (this.props.width !== prevProps.width) {
      this.initJSMpeg();
    }
    this.renderSampleView(this.props);
  }

  componentWillUnmount() {
    // Important to remove listener if component isn't active
    document.removeEventListener('keydown', this.keyDown);
    document.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('resize', this.setImageRatio);
  }

  onMouseMove(options) {
    this.drawGridPlugin.update(this.canvas, options.e.layerX, options.e.layerY);
  }

  onMouseUp() {
    this.drawGridPlugin.endDrawing(null, this.canvas);
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
    } else if (shape && shape.type === 'GridGroup') {
      if (shape.id !== null) {
        this.props.sampleActions.selectGrid(shape.id);
      }
    }
  }

  setImageRatio() {
    if (this.props.autoScale) {
      const clientWidth = document.getElementById('outsideWrapper').clientWidth;
      this.props.sampleActions.setImageRatio(clientWidth);
    }
  }

  setVCellSpacing(e) {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) { value = ''; }

    const gridData = this.selectedGrid();

    if (gridData) {
      const gd = this.drawGridPlugin.setCellSpace(gridData, true, gridData.cellHSpace, value);
      this.props.sampleActions.sendUpdateShape(gd.id, gd);
    } else if (this.props.selectedGrids.length === 0 && this.props.drawGrid) {
      this.drawGridPlugin.setCurrentCellSpace(null, value);
      this.drawGridPlugin.repaint(this.canvas);
    }
  }

  setHCellSpacing(e) {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) { value = ''; }

    const gridData = this.selectedGrid();

    if (gridData) {
      const gd = this.drawGridPlugin.setCellSpace(gridData, true, value, gridData.cellVSpace);
      this.props.sampleActions.sendUpdateShape(gd.id, gd);
    } else if (this.props.selectedGrids.length === 0 && this.props.drawGrid) {
      this.drawGridPlugin.setCurrentCellSpace(value, null);
      this.drawGridPlugin.repaint(this.canvas);
    }
  }

  selectedGrid() {
    let gridData = null;

    if (this.props.selectedGrids.length === 1) {
      gridData = this.props.grids[this.props.selectedGrids[0]];
    }

    return gridData;
  }

  gridCellSpacing() {
    let vSpace = 0;
    let hSpace = 0;

    if (this.props.selectedGrids.length === 1) {
      const gridData = this.props.grids[this.props.selectedGrids[0]];

      if (gridData) {
        vSpace = gridData.cellVSpace;
        hSpace = gridData.cellHSpace;
      }
    } else if (this.props.selectedGrids.length === 0 && this.props.drawGrid) {
      vSpace = this.drawGridPlugin.currentGridData().cellVSpace;
      hSpace = this.drawGridPlugin.currentGridData().cellHSpace;
    }

    return [hSpace, vSpace];
  }

  keyDown(event) {
    if (!this._keyPressed) {
      this._keyPressed = event.key;
    }
  }

  keyUp() {
    this._keyPressed = null;
  }

  goToBeam(e) {
    const { sampleActions, imageRatio } = this.props;
    const { sendGoToBeam } = sampleActions;

    // Only move to beam if the click was done directly on the canvas.
    if (e.target.tagName === 'CANVAS') {
      sendGoToBeam(e.layerX * imageRatio, e.layerY * imageRatio);
    }
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

        if (obj.type === 'GridGroup') {
          let gridData = this.props.grids[this.props.selectedGrids[0]];

          if (gridData) {
            showContextMenu(true, { type: 'GridGroupSaved', gridData, id: gridData.id },
                            e.offsetX, e.offsetY);
          } else {
            gridData = this.drawGridPlugin.currentGridData();
            showContextMenu(true, { type: 'GridGroup', gridData, id: obj.id },
                            e.offsetX, e.offsetY);
          }
        } else {
          showContextMenu(true, obj, obj.left, obj.top);
        }
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
    } else if (this.props.drawGrid) {
      this.drawGridPlugin.startDrawing(option, this.canvas);
      this.showGridForm();
    }
  }


  wheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const { sampleActions, motorSteps, zoom, motors } = this.props;
    const { sendMotorPosition, sendZoomPos } = sampleActions;
    const keyPressed = this._keyPressed;
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

  configureGrid() {
    const cellSizeX = this.props.beamSize.x * this.props.pixelsPerMm[0] / this.props.imageRatio;
    const cellSizeY = this.props.beamSize.y * this.props.pixelsPerMm[0] / this.props.imageRatio;
    this.drawGridPlugin.setCellSize(cellSizeX, cellSizeY);

    if (!this.props.drawGrid) {
      this.hideGridForm();
      this.drawGridPlugin.reset();
    }
  }

  showGridForm() {
    let left = null;
    let top = null;

    const gridData = this.selectedGrid();
    const gridForm = document.getElementById('gridForm');

    if (gridData) {
      left = gridData.screenCoord[0];
      top = gridData.screenCoord[1];
    } else if (this.props.selectedGrids.length === 0 && this.props.drawGrid) {
      left = this.drawGridPlugin.currentGridData().left;
      top = this.drawGridPlugin.currentGridData().top;
    }

    if (gridForm && left && top) {
      gridForm.style.top = `${top - 70}px`;
      gridForm.style.left = `${left + 15}px`;
      gridForm.style.display = 'block';
    } else {
      this.hideGridForm();
    }
  }

  hideGridForm() {
    const gridForm = document.getElementById('gridForm');

    if (gridForm) {
      gridForm.style.display = 'none';
    }
  }

  saveGrid() {
    this.props.sampleActions.addGrid(this.drawGridPlugin.currentGridData());
    this.props.sampleActions.toggleDrawGrid();
  }

  createVideoPlayerContainer(format) {
    // Default to MJPEG
    let result = (
      <img
        id= "sample-img"
        className="img"
        src="/mxcube/api/v0.1/sampleview/camera/subscribe"
        alt="SampleView"
      />);

    if (format === 'MPEG1') {
      result = (<canvas id="sample-img" className="img" />);
    }

    return result;
  }

  initJSMpeg() {
    const canvas = document.getElementById('sample-img');
    const source = `ws://${document.location.hostname}:4042/`;

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    if (this.props.videoFormat === 'MPEG1' && canvas) {
      this.player = new jsmpeg.JSMpeg.Player(source, {
        canvas, decodeFirstFrame: true, preserveDrawingBuffer: true });
      this.player.play();
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
      pixelsPerMm[0],
      beamPosition,
      beamShape,
      beamSize,
      clickCentringPoints,
      distancePoints,
      this.canvas
    ));
    const fabricSelectables = [
      ...makePoints(points, imageRatio),
      ...makeLines(lines, imageRatio)
    ];
    this.canvas.add(...fabricSelectables);
    if (group) {
      const groupIDs = group.getObjects().map((shape) => shape.id);
      const selectedShapes = [];
      fabricSelectables.forEach((obj) => {
        const shape = obj;
        if (groupIDs.includes(shape.id)) {
          selectedShapes.push(shape);
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
        }
      });
    }

    if (!this.drawGridPlugin.drawing && this.drawGridPlugin.shapeGroup) {
      this.canvas.add(this.drawGridPlugin.shapeGroup);
    }

    Object.values(this.props.grids).map((gd) => {
      const gridData = { ...gd };
      gridData.label = gd.name;

      if (this.props.selectedGrids.includes(gridData.id)) {
        gridData.selected = true;
      }

      return this.canvas.add(this.drawGridPlugin.shapeFromGridData(gridData).shapeGroup);
    });

    this.canvas.renderAll();
  }

  render() {
    this.configureGrid();
    this.showGridForm();

    return (
      <div>
        <div className="dropdown-menu" id="gridForm" style={{ zIndex: 1001, padding: '0.5em' }}>
          <Form inline>
            <FormGroup>
              <ControlLabel>H-Cell Spacing:</ControlLabel>
              <FormControl
                style={{ width: '50px', marginRight: '1em' }}
                type="text"
                value={this.gridCellSpacing()[0]}
                onChange={this.setHCellSpacing}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>V-Cell Spacing:</ControlLabel>
              <FormControl
                style={{ width: '50px' }}
                type="text"
                value={this.gridCellSpacing()[1]}
                onChange={this.setVCellSpacing}
              />
            </FormGroup>
          </Form>
        </div>
        <div className="outsideWrapper" id="outsideWrapper">
          <div className="insideWrapper" id="insideWrapper">
            <SampleControls
              {...this.props}
              canvas={this.canvas}
            />
            {this.createVideoPlayerContainer(this.props.videoFormat)}
            <canvas id="canvas" className="coveringCanvas" />
          </div>
        </div>
      </div>
    );
  }
}
