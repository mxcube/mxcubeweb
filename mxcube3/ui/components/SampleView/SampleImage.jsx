import './SampleView.css';
import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { makePoints, makeLines, makeImageOverlay, makeCross } from './shapes';
import DrawGridPlugin from './DrawGridPlugin';
import SampleControls from './SampleControls';

const jsmpeg = require('./jsmpeg.min.js');

import 'fabric';
const fabric = window.fabric;
fabric.Group.prototype.hasControls = false;
fabric.Group.prototype.hasBorders = false;

export default class SampleImage extends React.Component {

  constructor(props) {
    super(props);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.setImageRatio = this.setImageRatio.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.keyUp = this.keyUp.bind(this);
    this.setHCellSpacing = this.setHCellSpacing.bind(this);
    this.setVCellSpacing = this.setVCellSpacing.bind(this);
    this.gridCellSpacing = this.gridCellSpacing.bind(this);
    this.setGridOverlay = this.setGridOverlay.bind(this);
    this.saveGrid = this.saveGrid.bind(this);
    this.configureGrid = this.configureGrid.bind(this);
    this.updateGridResults = this.updateGridResults.bind(this);
    this.selectedGrid = this.selectedGrid.bind(this);
    this.initJSMpeg = this.initJSMpeg.bind(this);
    this.getGridForm = this.getGridForm.bind(this);
    this.centringMessage = this.centringMessage.bind(this);
    this.selectShape = this.selectShape.bind(this);
    this.deSelectShape = this.deSelectShape.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.selectShapeEvent = this.selectShapeEvent.bind(this);
    this.clearSelectionEvent = this.clearSelectionEvent.bind(this);
    this.canvas = {};
    this._keyPressed = null;
    this.gridStarted = false;
    this.girdOrigin = null;
    this.lineGroup = null;
    this.drawGridPlugin = new DrawGridPlugin();
    this.player = null;
    this.centringCross = [];
  }

  componentDidMount() {
    // Create fabric and set image background to sample
    this.canvas = new fabric.Canvas('canvas', { defaultCursor: 'crosshair' });

    // Bind leftClick to function
    this.canvas.on('mouse:down', (option) => this.leftClick(option));
    this.canvas.on('mouse:move', (options) => this.onMouseMove(options));
    this.canvas.on('mouse:up', (options) => this.onMouseUp(options));

    this.canvas.on('selection:created', (e) => this.selectShapeEvent(e));
    this.canvas.on('selection:cleared', (e) => this.clearSelectionEvent(e));

    // Bind rigth click to function manually with javascript
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
    if (this.props.clickCentring && this.props.clickCentringClicksLeft > 0) {
      if (this.centringCross.length === 2) {
        this.canvas.remove(this.centringCross[0]);
        this.canvas.remove(this.centringCross[1]);
      }

      this.centringCross = makeCross((options.e.layerX + 1.5) * this.props.imageRatio,
                                     (options.e.layerY + 1) * this.props.imageRatio,
                                     this.props.imageRatio,
                                     this.canvas.width, this.canvas.height);

      this.canvas.add(...this.centringCross);
    }

    this.drawGridPlugin.update(this.canvas,
                               options.e.layerX,
                               options.e.layerY,
                               this.props.imageRatio
                               );
  }

  onMouseUp() {
    this.drawGridPlugin.endDrawing(null, this.canvas);
  }

  setImageRatio() {
    if (this.props.autoScale) {
      const clientWidth = document.getElementById('outsideWrapper').clientWidth;
      this.props.sampleActions.setImageRatio(clientWidth);
    }
  }

  getGridForm() {
    let spacingDiv = [];
    if (this.props.cellSpacing !== 'None' && this.props.cellSpacing !== undefined) {
      let cellSpacingChoiceArray = this.props.cellSpacing.split(',');

      cellSpacingChoiceArray = cellSpacingChoiceArray.map((choice) =>
        choice.charAt(0).toUpperCase() + choice.slice(1)
      );

      spacingDiv = cellSpacingChoiceArray.map((choice) =>
        (
          <FormGroup>
            <ControlLabel>{choice} Spacing:</ControlLabel>
            <FormControl
              style={{ width: '50px', marginRight: '1em' }}
              type="text"
              value={choice === 'Horizontal' ?
                this.gridCellSpacing()[0] : this.gridCellSpacing()[1]}
              onChange={choice === 'Horizontal' ?
                this.setHCellSpacing : this.setVCellSpacing}
            />
          </FormGroup>
        )
      );
    }

    const gridForm = (
        <div className="dropdown-menu" id="gridForm" style={{ zIndex: 1001, padding: '0.5em' }}>
          <Form inline>
            { spacingDiv }
            <FormGroup>
            <ControlLabel>Overlay: </ControlLabel>
            <FormControl
              style={{ width: '100px', padding: '0', marginLeft: '10px', marginRight: '1em' }}
              className="bar"
              type="range"
              id="overlay-control"
              min="0" max="1"
              step="0.05"
              defaultValue={this.getGridOverlay()}
              onChange={this.setGridOverlay}
              ref="overlaySlider"
              name="overlaySlider"
            />
            </FormGroup>
          </Form>
        </div>);

    return gridForm;
  }

  setVCellSpacing(e) {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) { value = ''; }

    const gridData = this.selectedGrid();

    if (gridData) {
      const gd = this.drawGridPlugin.setCellSpace(gridData, true, gridData.cellHSpace, value);
      this.props.sampleActions.sendUpdateShapes([gd]);
    } else if (this.selectedGrid() === null && this.props.drawGrid) {
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
      this.props.sampleActions.sendUpdateShapes([gd]);
    } else if (this.selectedGrid() === null && this.props.drawGrid) {
      this.drawGridPlugin.setCurrentCellSpace(value, null);
      this.drawGridPlugin.repaint(this.canvas);
    }
  }

  setGridOverlay(e) {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) { value = '1'; }
    const gridData = this.selectedGrid();
    if (gridData) {
      const gd = this.drawGridPlugin.setGridOverlay(gridData, value);
      this.props.sampleActions.setOverlay(value);
      this.drawGridPlugin.repaint(this.canvas);
      // Note: I am missing sth, next line needed for update the state and triggering
      // the component rendering, this.props.sampleActions.setOverlay alone not doing that
      this.props.sampleActions.updateShapes([gd]);
    }
  }

  getGridOverlay() {
    let overlay = 1.0;
    if (this.selectedGrid() !== null) {
      const gridData = this.selectedGrid();
      if (gridData) {
        overlay = gridData.overlayLevel;
      }
    } else if (this.selectedGrid() === null && this.props.drawGrid) {
      overlay = 1;
    }

    return overlay;
  }


  gridCellSpacing() {
    let vSpace = 0;
    let hSpace = 0;

    if (this.selectedGrid() !== null) {
      const gridData = this.props.grids[this.selectedGrid()];

      if (gridData) {
        vSpace = gridData.cellVSpace;
        hSpace = gridData.cellHSpace;
      }
    } else if (this.selectedGrid() === null && this.props.drawGrid) {
      vSpace = this.drawGridPlugin.currentGridData().cellVSpace;
      hSpace = this.drawGridPlugin.currentGridData().cellHSpace;
    }

    return [hSpace, vSpace];
  }

  selectedGrid() {
    return this.props.selectedGrids[0];
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
    if (e.target.tagName === 'CANVAS' && e.shiftKey) {
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
    e.preventDefault();

    const { sampleActions } = this.props;
    const { showContextMenu } = sampleActions;

    const group = this.canvas.getActiveGroup();
    const clickPoint = new fabric.Point(e.offsetX, e.offsetY);
    let ctxMenuObj = { type: 'NONE' };
    let objectFound = false;

    // Existing selection clicked
    if (group && group.containsPoint(clickPoint)) {
      const shapes = group.getObjects();
      this.canvas.discardActiveGroup();

      group.getObjects().forEach((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = true;
        }
      });

      if (objectFound) {
        const pointList = shapes.filter((shape) => (
          this.props.points[shape.id] !== undefined)).map((shape) => (shape.id));

        const gridList = shapes.filter((shape) => (
          this.props.grids[shape.id] !== undefined)).map((shape) => (shape.id));

        const lineList = shapes.filter((shape) => (
          this.props.lines[shape.id] !== undefined)).map((shape) => (shape.id));

        if (pointList.length === 2) {
          ctxMenuObj = { type: 'HELICAL', id: this.props.selectedShapes };
        } else if (pointList.length === 1 && this.props.points[pointList[0]].state === 'SAVED') {
          ctxMenuObj = { type: 'SAVED', id: pointList };
        } else if (pointList.length === 1 && this.props.points[pointList[0]].state === 'TMP') {
          ctxMenuObj = { type: 'TMP', id: pointList };
        } else if (pointList.length > 2) {
          ctxMenuObj = { type: 'GROUP', id: pointList };
        } else if (gridList.length === 1) {
          ctxMenuObj = { type: 'GridGroupSaved', gridData: gridList[0], id: gridList[0].id };
        } else if (lineList.length !== 0) {
          ctxMenuObj = { type: 'LINE', id: lineList };
        }
      }
    } else {
      // One or several individual objects clicked
      this.canvas.forEachObject((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = true;

          this.selectShape([obj], false);

          if (obj.type === 'GridGroup') {
            let gridData = this.props.grids[obj.id];

            if (gridData) {
              ctxMenuObj = { type: 'GridGroupSaved', gridData, id: gridData.id };
            } else {
              gridData = this.drawGridPlugin.currentGridData();
              ctxMenuObj = { type: 'GridGroup', gridData, id: obj.id };
            }
          } else {
            ctxMenuObj = obj;
          }
        }
      });
    }

    if (!objectFound) {
      this.canvas.discardActiveGroup();
    }

    showContextMenu(true, ctxMenuObj, e.offsetX, e.offsetY);
  }

  leftClick(option) {
    let objectFound = false;

    if (option.target && option.target.type === 'group') {
      const group = this.canvas.getActiveGroup();
      const clickPoint = new fabric.Point(option.e.offsetX, option.e.offsetY);

      // Important to call this for containsPoint to work properly
      this.canvas.discardActiveGroup();

      group.getObjects().forEach((obj) => {
        if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
          objectFound = obj;
        } else {
          this.deSelectShape([obj], option.e.ctrlKey);
        }
      });
    } else if (option.target) {
      objectFound = option.target;
    }

    if (!objectFound) {
      this.clearSelection();
    } else {
      this.selectShape([objectFound], option.e.ctrlKey);
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
    if (keyPressed === 'r' && motors.phi.state === 2) {
      // then we rotate phi axis by the step size defined in its box
      if (e.deltaX > 0 || e.deltaY > 0) {
        // zoom in
        sendMotorPosition('Phi', motors.phi.position + parseInt(motorSteps.phiStep, 10));
      } else if (e.deltaX < 0 || e.deltaY < 0) {
        // zoom out
        sendMotorPosition('Phi', motors.phi.position - parseInt(motorSteps.phiStep, 10));
      }
    } else if (keyPressed === 'f' && motors.focus.state === 2) {
      if (e.deltaY > 0) {
        // Focus in
        sendMotorPosition('Focus', motors.focus.position + parseFloat(motorSteps.focusStep, 10));
      } else if (e.deltaY < 0) {
        // Focus out
        sendMotorPosition('Focus', motors.focus.position - parseFloat(motorSteps.focusStep, 10));
      }
    } else if (keyPressed === 'z' && motors.zoom.state === 2) {
      // in this case zooming
      if (e.deltaY > 0 && motors.zoom.position < 10) {
        // zoom in
        sendZoomPos(motors.zoom.position + 1);
      } else if (e.deltaY < 0 && motors.zoom.position > 0) {
        // zoom out
        sendZoomPos(motors.zoom.position - 1);
      }
    }
  }

  configureGrid() {
    const cellSizeX = this.props.beamSize.x * this.props.pixelsPerMm[0] / this.props.imageRatio;
    const cellSizeY = this.props.beamSize.y * this.props.pixelsPerMm[1] / this.props.imageRatio;
    this.drawGridPlugin.setCellSize(cellSizeX, cellSizeY);
    this.drawGridPlugin.setCellCounting(this.props.cellCounting);

    if (!this.props.drawGrid) {
      this.hideGridForm();
      this.drawGridPlugin.reset();
    }
  }

  updateGridResults() {
    const gd = this.selectedGrid();
    if (gd) {
      this.drawGridPlugin.setGridResult(gd.result);
    }
  }

  showGridForm() {
    let left = null;
    let top = null;

    const gridData = this.selectedGrid();
    const gridForm = document.getElementById('gridForm');

    if (gridData) {
      left = gridData.screenCoord[0] / this.props.imageRatio;
      top = gridData.screenCoord[1] / this.props.imageRatio;
    } else if (this.selectedGrid() === null && this.props.drawGrid) {
      left = this.drawGridPlugin.currentGridData().left;
      top = this.drawGridPlugin.currentGridData().top;
    }

    if (gridForm && left && top) {
      gridForm.style.top = `${(top - 70)}px`;
      gridForm.style.left = `${(left + 15)}px`;
      gridForm.style.display = 'block';
    } else {
      this.hideGridForm();
    }
  }

  selectShape(shapes, include) {
    const updatedShapes = [];
    // Single selection if shapes are NOT to be included,
    // i.e. CTRL key not pressed
    if (!include) {
      this.clearSelection();
    }

    shapes.forEach((s) => {
      const shapeData = this.props.shapes[s.id];
      const shape = s;

      if (shapeData && include) {
        shape.active = !shapeData.selected;
        shapeData.selected = !shapeData.selected;
        updatedShapes.push(shapeData);
      } else if (shapeData && !shapeData.selected) {
        shape.active = true;
        shapeData.selected = true;
        updatedShapes.push(shapeData);
      }
    });

    if (updatedShapes.length > 0) {
      this.props.sampleActions.sendUpdateShapes(updatedShapes);
    }
  }

  deSelectShape(shapes, include) {
    const updatedShapes = [];

    shapes.forEach((s) => {
      const shapeData = this.props.shapes[s.id];
      const shape = s;

      if (shapeData && shapeData.selected && !include) {
        shape.active = false;
        shapeData.selected = false;
        updatedShapes.push(shapeData);
      }
    });

    if (updatedShapes.length > 0) {
      this.props.sampleActions.sendUpdateShapes(updatedShapes);
    }
  }

  selectShapeEvent(options) {
    let shapes = [];

    if (options.e !== undefined && options.target.id === undefined) {
      shapes = options.target.getObjects();
      this.selectShape(shapes, options.e.ctrlKey);
    }
  }

  clearSelection() {
    const updatedShapes = [];

    // Single selection if shapes are NOT to be included i.e control key is
    // NOT pressed
    Object.values(this.props.shapes).forEach((s) => {
      if (s.selected) {
        const shapeData = this.props.shapes[s.id];
        shapeData.selected = false;
        updatedShapes.push(shapeData);
      }
    });

    if (updatedShapes.length > 0) {
      this.props.sampleActions.sendUpdateShapes(updatedShapes);
    }
  }

  clearSelectionEvent(options) {
    // Single selection if control key is NOT pressed
    if (options.e !== undefined && !options.e.ctrlKey) {
      this.clearSelection();
    }
  }

  hideGridForm() {
    const gridForm = document.getElementById('gridForm');

    if (gridForm) {
      gridForm.style.display = 'none';
    }
  }

  saveGrid() {
    this.drawGridPlugin.initializeGridResult();
    this.props.sampleActions.addGrid(this.drawGridPlugin.currentGridData());
    this.props.sampleActions.toggleDrawGrid();
  }

  centringMessage() {
    let message = '';
    let result = null;

    if (this.props.clickCentringClicksLeft === 0) {
      message += 'Save centring or clicking on screen to restart';
    } else {
      message += `Clicks left: ${this.props.clickCentringClicksLeft}`;
    }

    if (this.props.clickCentring) {
      result =
	(
          <div
            key={this.props.clickCentringClicksLeft}
            id="video-message-overlay"
          >
            3-Click Centring: <br /> {message}
         </div>
	);
    }

    return result;
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
      clickCentring,
      distancePoints,
      points,
      lines,
      grids,
      pixelsPerMm
    } = nextProps;
    this.drawCanvas(imageRatio);
    this.canvas.add(...makeImageOverlay(
      imageRatio,
      pixelsPerMm,
      beamPosition,
      beamShape,
      beamSize,
      clickCentring,
      distancePoints,
      this.canvas
    ));

    if (this.props.clickCentring === false || this.props.clickCentringClicksLeft === 0) {
      this.centringCross = [];
    }

    this.canvas.add(...this.centringCross);

    const fabricSelectables = [
      ...makePoints(points, imageRatio),
      ...makeLines(lines, imageRatio)
    ];

    // Grids already defined (drawn)
    Object.values(grids).forEach((gd) => {
      const gridData = { ...gd };
      fabricSelectables.push(this.drawGridPlugin.shapeFromGridData(
        gridData, imageRatio).shapeGroup);
    });

    // Grid beeing defined (being drawn)
    if (this.drawGridPlugin.shapeGroup) {
      fabricSelectables.push(this.drawGridPlugin.shapeGroup);
    }

    this.canvas.add(...fabricSelectables);

    // Handle fabric selection logic, create an active group with currently
    // selected shapes, either selected through multiple selection or through
    // single item selection
    const aShapes = [];

    if (group) {
      const groupIDs = group.getObjects().map((shape) => shape.id);

      fabricSelectables.forEach((obj) => {
        const shape = obj;
        if (groupIDs.includes(shape.id)) {
          aShapes.push(shape);
          shape.active = true;
        }
      });
    } else if (selection) {
      fabricSelectables.forEach((s) => {
        const shape = s;
        const shapeData = this.props.shapes[shape.id];

        if (shapeData && shapeData.selected) {
          shape.active = true;
          aShapes.push(shape);
        }
      });
    }

    this.canvas.setActiveGroup(new fabric.Group(aShapes, { originX: 'center', originY: 'center' }));

    this.canvas.renderAll();
  }

  render() {
    this.configureGrid();
    this.showGridForm();
    this.updateGridResults();
    return (
      <div>
        {this.getGridForm()}
        <div className="outsideWrapper" id="outsideWrapper">
          <div className="insideWrapper" id="insideWrapper">
            {this.createVideoPlayerContainer(this.props.videoFormat)}
            <SampleControls
              {...this.props}
              canvas={this.canvas}
            />
            {this.centringMessage()}
            <canvas id="canvas" className="coveringCanvas" />
          </div>
        </div>
      </div>
    );
  }
}
