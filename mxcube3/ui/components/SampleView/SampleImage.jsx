import './SampleView.css';
import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { makePoints, makeLines, makeImageOverlay, makeCross } from './shapes';
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
    this.setGridOverlay = this.setGridOverlay.bind(this);
    this.saveGrid = this.saveGrid.bind(this);
    this.configureGrid = this.configureGrid.bind(this);
    this.updateGridResults = this.updateGridResults.bind(this);
    this.selectedGrid = this.selectedGrid.bind(this);
    this.initJSMpeg = this.initJSMpeg.bind(this);
    this.getGridForm = this.getGridForm.bind(this);
    this.centringMessage = this.centringMessage.bind(this);
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

  setColorPoint(o, selection) {
    let myP = '';
    if (o.e !== undefined && o.target !== undefined) {
      myP = o.target.id !== undefined ? o.target.id : '';
      if (myP.startsWith('P')) {
        this.props.sampleActions.savePointId(myP);
      }
    }

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
      this.props.sampleActions.updateShape(gd);
    }
  }

  getGridOverlay() {
    let overlay = 1.0;
    if (this.props.selectedGrids.length === 1) {
      const gridData = this.selectedGrid();
      if (gridData) {
        overlay = gridData.overlayLevel;
      }
    } else if (this.props.selectedGrids.length === 0 && this.props.drawGrid) {
      overlay = 1;
    }

    return overlay;
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

  selectedGrid() {
    let gridData = null;

    if (this.props.selectedGrids.length === 1) {
      gridData = this.props.grids[this.props.selectedGrids[0]];
    }

    return gridData;
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

        const pointList = {};
        points.map((point, index) => {
          pointList[`p${index + 1}`] = point.id;
          return pointList;
        });

        if (points.length === 2) {
          showContextMenu(true, {
            type: 'HELICAL',
            id: pointList
          },
            e.offsetX, e.offsetY);
        } else {
          showContextMenu(true, {
            type: 'GROUP',
            id: pointList
          },
            e.offsetX, e.offsetY);
        }
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
    } else if (this.props.selectedGrids.length === 0 && this.props.drawGrid) {
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

    if (this.drawGridPlugin.shapeGroup) {
      this.canvas.add(this.drawGridPlugin.shapeGroup);
    }

    Object.values(this.props.grids).map((gd) => {
      const gridData = { ...gd };
      gridData.label = gd.name;

      if (this.props.selectedGrids.includes(gridData.id)) {
        gridData.selected = true;
      }
      return this.canvas.add(this.drawGridPlugin.shapeFromGridData(gridData,
                                                                   this.props.imageRatio
                                                                  ).shapeGroup);
    });

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
