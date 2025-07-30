/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/control-has-associated-label */
import 'fabric';

import React from 'react';

import { HW_STATE } from '../../constants';
import SampleControls from '../SampleControls/SampleControls';
import DrawGridPlugin from './DrawGridPlugin';
import GridForm from './GridForm';
import { JSMpeg } from './jsmpeg.min.js';
import {
  makeCentringHorizontalLine,
  makeCentringVerticalLine,
  makeImageOverlay,
  makeLines,
  makePoints,
  makeTwoDPoints,
} from './shapes';

const { fabric } = globalThis;
fabric.Group.prototype.hasControls = false;
fabric.Group.prototype.hasBorders = false;

export default class SampleImage extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.leftClick = this.leftClick.bind(this);
    this.rightClick = this.rightClick.bind(this);
    this.setImageRatio = this.setImageRatio.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.keyUp = this.keyUp.bind(this);
    this.wheel = this.wheel.bind(this);
    this.goToBeam = this.goToBeam.bind(this);
    this.setHCellSpacing = this.setHCellSpacing.bind(this);
    this.setVCellSpacing = this.setVCellSpacing.bind(this);
    this.setGridOverlayOpacity = this.setGridOverlayOpacity.bind(this);
    this.getGridOverlayOpacity = this.getGridOverlayOpacity.bind(this);
    this.saveGrid = this.saveGrid.bind(this);
    this.configureGrid = this.configureGrid.bind(this);
    this.updateGridResults = this.updateGridResults.bind(this);
    this.selectedGrid = this.selectedGrid.bind(this);
    this.initJSMpeg = this.initJSMpeg.bind(this);
    this.centringMessage = this.centringMessage.bind(this);
    this.selectShape = this.selectShape.bind(this);
    this.deSelectShape = this.deSelectShape.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.selectShapeEvent = this.selectShapeEvent.bind(this);
    this.clearSelectionEvent = this.clearSelectionEvent.bind(this);
    this.toggleGridVisibility = this.toggleGridVisibility.bind(this);
    this.canvas = {};
    this.drawGridPlugin = new DrawGridPlugin();
    this.drawGridPlugin.setGridResultFormat(props.meshResultFormat);
    this._keyPressed = null;
    this.gridStarted = false; // eslint-disable-line react/no-unused-class-component-methods
    this.girdOrigin = null; // eslint-disable-line react/no-unused-class-component-methods
    this.lineGroup = null; // eslint-disable-line react/no-unused-class-component-methods
    this.player = null;
    this.centringCross = []; // eslint-disable-line react/no-unused-class-component-methods
    this.removeShapes = this.removeShapes.bind(this);
  }

  componentDidMount() {
    // Create fabric and set image background to sample
    this.canvas = new fabric.Canvas('canvas', {
      defaultCursor: 'crosshair',
      altSelectionKey: 'altKey',
      selectionKey: 'ctrlKey',
      preserveObjectStacking: true,
    });

    this.drawGridPlugin.canvas = this.canvas;

    // Bind leftClick to function
    this.canvas.on('mouse:down', this.leftClick);
    this.canvas.on('mouse:move', this.onMouseMove);
    this.canvas.on('mouse:up', this.onMouseUp);
    /*  */
    this.canvas.on('selection:created', this.selectShapeEvent);
    this.canvas.on('selection:cleared', this.clearSelectionEvent);
    this.canvas.on('selection:updated', this.selectShapeEvent);

    // Bind rigth click to function manually with javascript
    const imageOverlay = document.querySelector('#insideWrapper');
    imageOverlay.addEventListener('contextmenu', this.rightClick, false);
    // Bind mouse scroll up/down to function manually with javascript
    imageOverlay.addEventListener('wheel', this.wheel, false);
    // Bind mouse double click to function manually with javascript
    imageOverlay.addEventListener('dblclick', this.goToBeam, false);

    this.setImageRatio();

    // Add so that the canvas will resize if the window changes size
    window.addEventListener('resize', this.setImageRatio);
    document.addEventListener('keydown', this.keyDown, false);
    document.addEventListener('keyup', this.keyUp, false);

    globalThis.initJSMpeg = this.initJSMpeg;
    this.initJSMpeg();
  }

  // eslint-disable-next-line react/no-unsafe
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { width, cinema } = this.props;
    if (
      nextProps.width !== width ||
      nextProps.cinema !== cinema ||
      (nextProps.autoScale && this.props.imageRatio !== nextProps.imageRatio)
    ) {
      this.setImageRatio();
    }

    this.drawGridPlugin.setScale(nextProps.imageRatio);
  }

  componentDidUpdate(prevProps) {
    // Initialize JSMpeg for decoding the MPEG1 stream
    if (prevProps.videoFormat !== 'MPEG1') {
      this.initJSMpeg();
    }

    this.renderSampleView();
  }

  componentWillUnmount() {
    if (this.canvas) {
      this.canvas.dispose();
    }

    if (this.player) {
      try {
        this.player.destroy();
        this.player = null;
      } catch {
        this.player = null;
      }
    }

    this.canvas.off('mouse:down', this.leftClick);
    this.canvas.off('mouse:move', this.onMouseMove);
    this.canvas.off('mouse:up', this.onMouseUp);
    this.canvas.off('selection:created', this.selectShapeEvent);
    this.canvas.off('selection:updated', this.selectShapeEvent);
    this.canvas.off('selection:cleared', this.clearSelectionEvent);

    document.removeEventListener('keydown', this.keyDown);
    document.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('resize', this.setImageRatio);

    const imageOverlay = document.querySelector('#insideWrapper');
    imageOverlay.removeEventListener('contextmenu', this.rightClick);
    imageOverlay.removeEventListener('wheel', this.wheel);
    imageOverlay.removeEventListener('dblclick', this.goToBeam);

    globalThis.initJSMpeg = null;
  }

  onMouseMove(options) {
    if (this.props.clickCentring && this.props.clickCentringClicksLeft > 0) {
      if (
        this.centringVerticalLine !== undefined ||
        this.centringHorizontalLine !== undefined
      ) {
        this.canvas.remove(this.centringVerticalLine);
        this.canvas.remove(this.centringHorizontalLine);
      }

      this.centringVerticalLine = makeCentringVerticalLine(
        (options.e.layerX + 1.5) / this.props.imageRatio,
        (options.e.layerY + 1) / this.props.imageRatio,
        this.props.imageRatio,
        this.canvas.height,
      );

      this.centringHorizontalLine = makeCentringHorizontalLine(
        (options.e.layerX + 1.5) / this.props.imageRatio,
        (options.e.layerY + 1) / this.props.imageRatio,
        this.props.imageRatio,
        this.canvas.width,
      );

      this.canvas.add(this.centringVerticalLine);
      this.canvas.add(this.centringHorizontalLine);
    }

    if (options.e.buttons > 0 && this.drawGridPlugin.drawing) {
      this.drawGridPlugin.update(
        this.canvas,
        options.e.layerX,
        options.e.layerY,
      );
    }

    this.drawGridPlugin.onCellMouseOver(options, this.canvas);
  }

  onMouseUp() {
    this.drawGridPlugin.endDrawing();
  }

  setImageRatio() {
    if (this.props.autoScale) {
      const { clientWidth } = document.querySelector('#outsideWrapper');
      this.props.sampleViewActions.setImageRatio(clientWidth);
    }
  }

  setVCellSpacing(e) {
    let value = Number.parseFloat(e.target.value);
    if (Number.isNaN(value)) {
      value = 0;
    }

    const gridData = this.selectedGrid();

    if (gridData) {
      const gd = this.drawGridPlugin.setCellSpace(
        gridData,
        true,
        gridData.cellHSpace,
        value,
      );
      this.props.sampleViewActions.updateShapes([gd]);
    } else if (this.props.drawGrid) {
      this.drawGridPlugin.setCurrentCellSpace(
        null,
        value,
        this.props.imageRatio,
      );
      this.drawGridPlugin.repaint(this.canvas);
    }
  }

  setHCellSpacing(e) {
    let value = Number.parseFloat(e.target.value);
    if (Number.isNaN(value)) {
      value = 0;
    }

    const gridData = this.selectedGrid();

    if (gridData) {
      const gd = this.drawGridPlugin.setCellSpace(
        gridData,
        true,
        value,
        gridData.cellVSpace,
      );
      this.props.sampleViewActions.updateShapes([gd]);
    } else if (this.props.drawGrid) {
      this.drawGridPlugin.setCurrentCellSpace(
        value,
        null,
        this.props.imageRatio,
      );
      this.drawGridPlugin.repaint(this.canvas);
    }
  }

  setGridOverlayOpacity(e) {
    let value = Number.parseFloat(e.target.value);

    if (Number.isNaN(value)) {
      value = '1';
    }

    this.drawGridPlugin.setGridOverlay(value);
    this.props.sampleViewActions.setOverlay(value);
    this.drawGridPlugin.repaint(this.canvas);
    this.renderSampleView();
  }

  getGridOverlayOpacity() {
    let overlay = 1;
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

  selectedGrid() {
    let grid = null;

    if (this.props.selectedGrids.length > 0) {
      grid = this.props.selectedGrids[0];
    }

    return grid;
  }

  keyDown(event) {
    if (!this._keyPressed) {
      this._keyPressed = event.key;

      if (
        this._keyPressed === 'Delete' &&
        document.activeElement.tagName === 'BODY'
      ) {
        this.removeShapes();
      }

      if (this._keyPressed === 'Escape') {
        if (this.props.clickCentring) {
          this.props.sampleViewActions.abortCentring();
        }

        if (this.props.drawGrid) {
          this.props.sampleViewActions.toggleDrawGrid();
        }
      }
    }
  }

  removeShapes() {
    if (this.props.clickCentring) {
      this.props.sampleViewActions.abortCentring();
    }

    this.props.selectedShapes.forEach((shapeID) => {
      this.props.sampleViewActions.deleteShape(shapeID);
    });
  }

  keyUp() {
    this._keyPressed = null;
  }

  goToBeam(e) {
    const { sampleViewActions, imageRatio } = this.props;
    const { moveToBeam } = sampleViewActions;

    // Only move to beam if the click was done directly on the canvas.
    if (e.target.tagName === 'CANVAS' && e.shiftKey) {
      moveToBeam(e.layerX / imageRatio, e.layerY / imageRatio);
    }
  }

  drawCanvas(imageRatio, sourceScale) {
    // Getting the size of screen
    const { width, height } = this.props;
    const w = (width * imageRatio) / sourceScale;
    const h = (height * imageRatio) / sourceScale;
    // Set the size of the original html Canvas
    const canvasWindow = document.querySelector('#canvas');
    canvasWindow.width = w;
    canvasWindow.height = h;
    // Set the size of the created FabricJS Canvas
    this.canvas.setDimensions({ width: w, height: h });
    this.canvas.requestRenderAll();
    this.canvas.clear();

    // Set size of the Image from
    document.querySelector('#sample-img').style.height = `${h}px`;
    document.querySelector('#sample-img').style.width = `${w}px`;
    document.querySelector('#insideWrapper').style.height = `${h}px`;
  }

  rightClick(e) {
    e.preventDefault();

    const { showContextMenu } = this.props.sampleViewActions;

    const group = this.canvas.getActiveObject();
    const clickPoint = new fabric.Point(e.offsetX, e.offsetY);
    let ctxMenuObj;
    let objectFound = false;
    // Existing selection clicked
    if (
      group &&
      group.type === 'activeSelection' &&
      group.containsPoint(clickPoint)
    ) {
      const shapes = group.getObjects();
      // this.canvas.discardActiveObject();

      group.getObjects().forEach((obj) => {
        if (
          (!objectFound &&
            obj.containsPoint(clickPoint, null, true) &&
            obj.selectable) ||
          obj.active
        ) {
          objectFound = true;
        }
      });

      if (objectFound) {
        const threeDpointList = shapes
          .filter((shape) => this.props.points[shape.id] !== undefined)
          .map((shape) => shape.id);

        const twoDPointList = shapes
          .filter((shape) => this.props.twoDPoints[shape.id] !== undefined)
          .map((shape) => shape.id);

        const gridList = shapes
          .filter((shape) => this.props.grids[shape.id] !== undefined)
          .map((shape) => shape.id);

        const lineList = shapes
          .filter((shape) => this.props.lines[shape.id] !== undefined)
          .map((shape) => shape.id);

        if (threeDpointList.length === 2 || twoDPointList.length === 2) {
          ctxMenuObj = { type: 'HELICAL', id: this.props.selectedShapes };
        } else if (
          threeDpointList.length === 1 &&
          this.props.points[threeDpointList[0]].state === 'SAVED'
        ) {
          ctxMenuObj = { type: 'SAVED', id: threeDpointList[0] };
        } else if (
          twoDPointList.length === 1 &&
          this.props.twoDPoints[twoDPointList[0]].state === 'SAVED'
        ) {
          ctxMenuObj = { type: 'SAVED', id: twoDPointList[0] };
        } else if (
          threeDpointList.length === 1 &&
          this.props.points[threeDpointList[0]].state === 'TMP'
        ) {
          ctxMenuObj = { type: 'TMP', id: threeDpointList[0] };
        } else if (threeDpointList.length > 2) {
          ctxMenuObj = { type: 'GROUP', id: threeDpointList };
        } else if (gridList.length === 1) {
          const gridData = this.drawGridPlugin.setPixelsPerMM(
            this.props.pixelsPerMm,
            this.props.grids[gridList[0]],
          );
          const cellCenter = this.drawGridPlugin.getClickedCell(
            gridData,
            group.getObjects()[0],
            e,
          );
          ctxMenuObj = {
            type: 'GridGroupSaved',
            gridData,
            id: gridData.id,
            cellCenter,
          };
        } else if (lineList.length > 0) {
          ctxMenuObj = { type: 'LINE', id: lineList };
        }
      }
    } else {
      // Individual object clicked
      this.canvas.forEachObject((obj) => {
        if (
          !objectFound &&
          obj.containsPoint(clickPoint) &&
          obj.selectable &&
          (obj.type === 'SAVED' || obj.type === 'TMP')
        ) {
          objectFound = true;
          this.selectShape([obj], e.ctrlKey);
          ctxMenuObj = obj;
        }
      });
      if (!objectFound) {
        this.canvas.forEachObject((obj) => {
          if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
            objectFound = true;

            this.selectShape([obj], e.ctrlKey);

            if (obj.type === 'GridGroup') {
              let gridData = this.props.grids[obj.id];
              if (gridData) {
                const cellCenter = this.drawGridPlugin.getClickedCell(
                  gridData,
                  obj,
                  e,
                );
                ctxMenuObj = {
                  type: 'GridGroupSaved',
                  gridData,
                  id: gridData.id,
                  cellCenter,
                };
              } else {
                gridData = this.drawGridPlugin.currentGridData();
                gridData = this.drawGridPlugin.saveGrid(gridData);
                ctxMenuObj = { type: 'GridGroup', gridData, id: obj.id };
              }
            } else {
              ctxMenuObj = obj;
            }
          }
        });
      }
    }

    if (!objectFound) {
      this.canvas.discardActiveObject();
    }

    const { imageRatio } = this.props;
    showContextMenu(
      true,
      ctxMenuObj,
      e.pageX,
      e.pageY,
      e.offsetX / imageRatio,
      e.offsetY / imageRatio,
    );
  }

  leftClick(option) {
    this.canvas.selection = true; // Enable group selection
    let objectFound = false;
    this.drawGridPlugin.clearMouseOverGridLabel(this.canvas);

    const {
      sampleViewActions,
      clickCentring,
      measureDistance,
      imageRatio,
      drawGrid,
    } = this.props;

    if (clickCentring) {
      this.canvas.selection = false; // Disable group selection
      sampleViewActions.recordCentringClick(
        option.e.layerX / imageRatio,
        option.e.layerY / imageRatio,
      );
    } else if (measureDistance) {
      this.canvas.selection = false; // Disable group selection
      sampleViewActions.addDistancePoint(
        option.e.layerX / imageRatio,
        option.e.layerY / imageRatio,
      );
    } else if (drawGrid) {
      this.canvas.selection = false; // Disable group selection
      this.drawGridPlugin.startDrawing(option, this.canvas, imageRatio);
    } else if (option.target && !(option.e.shiftKey || option.e.ctrlKey)) {
      if (option.target.type === 'activeSelection') {
        const group = this.canvas.getActiveObject();
        const clickPoint = new fabric.Point(option.e.offsetX, option.e.offsetY);

        group.getObjects().forEach((obj) => {
          if (!objectFound && obj.containsPoint(clickPoint) && obj.selectable) {
            objectFound = obj;
          }
        });
      } else {
        objectFound = option.target;
      }

      const shapeData = this.drawGridPlugin.setPixelsPerMM(
        this.props.pixelsPerMm,
        this.props.shapes[objectFound.id],
      );

      const [cellIdxX, cellIdxY] = this.drawGridPlugin.getClickedCellIndex(
        shapeData,
        option.target,
        option.pointer,
      );

      const imgNum = this.drawGridPlugin.countCells(
        shapeData.cellCountFun,
        cellIdxY,
        cellIdxX,
        shapeData.numRows,
        shapeData.numCols,
      );

      const { resultDataPath } = shapeData;
      if (resultDataPath !== undefined) {
        this.props.displayImage(`${resultDataPath}&img_num=${imgNum}`);
      }
    }
  }

  wheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const { hardwareObjects, uiproperties, setAttribute } = this.props;
    const { components } = uiproperties.sample_view_motors;
    const keyPressed = this._keyPressed;

    const omegaProps = components.find((c) => c.role === 'omega');
    const focusProps = components.find((c) => c.role === 'focus');
    const zoomProps = components.find((c) => c.role === 'zoom');

    const omega = hardwareObjects[omegaProps.attribute];
    const focus = hardwareObjects[focusProps.attribute];
    const zoom = hardwareObjects[zoomProps.attribute];

    if (keyPressed === 'r' && omega.state === HW_STATE.READY) {
      if (e.deltaY > 0) {
        setAttribute(omegaProps.attribute, omega.value + omegaProps.step);
      } else if (e.deltaY < 0) {
        setAttribute(omegaProps.attribute, omega.value - omegaProps.step);
      }
    } else if (keyPressed === 'f' && focus.state === HW_STATE.READY) {
      if (e.deltaY > 0) {
        setAttribute(focusProps.attribute, focus.value + focusProps.step);
      } else if (e.deltaY < 0) {
        setAttribute(focusProps.attribute, focus.value - focusProps.step);
      }
    } else if (keyPressed === 'z' && zoom.state === HW_STATE.READY) {
      const index = zoom.commands.indexOf(zoom.value);
      if (e.deltaY > 0 && index < zoom.commands.length - 1) {
        setAttribute(zoomProps.attribute, zoom.commands[index + 1]);
      } else if (e.deltaY < 0 && index > 0) {
        setAttribute(zoomProps.attribute, zoom.commands[index - 1]);
      }
    }
  }

  configureGrid() {
    const cellSizeX = this.props.beamSize.x * 1000;
    const cellSizeY = this.props.beamSize.y * 1000;
    this.drawGridPlugin.setScale(this.props.imageRatio);
    this.drawGridPlugin.setPixelsPerMM(this.props.pixelsPerMm);
    this.drawGridPlugin.setCellSize(cellSizeX, cellSizeY);
    this.drawGridPlugin.setCellCounting(this.props.cellCounting);

    if (!this.props.drawGrid) {
      this.drawGridPlugin.reset();
    }
  }

  updateGridResults() {
    const gd = this.selectedGrid();

    if (gd) {
      this.drawGridPlugin.setGridResult(gd.result);
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
      this.props.sampleViewActions.updateShapes(updatedShapes);
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
      this.props.sampleViewActions.updateShapes(updatedShapes);
    }
  }

  selectShapeEvent(options) {
    if (
      !this.props.drawGrid &&
      !this.props.clickCentring &&
      !this.props.measureDistance &&
      !this.props.contextMenuVisible &&
      options.e !== undefined
    ) {
      if (options.selected.length > 0) {
        this.selectShape(options.selected, options.e.ctrlKey);
      } else if (options.deselected.length > 0) {
        this.deSelectShape(options.deselected);
      }
    }
  }

  clearSelection() {
    const updatedShapes = [];

    // Single selection if shapes are NOT to be included i.e control key is
    // NOT pressed
    Object.values(this.props.shapes).forEach((s) => {
      if (s.selected) {
        const shapeData = this.props.shapes[s.id];
        if (shapeData) {
          shapeData.selected = false;
          updatedShapes.push(shapeData);
        }
      }
    });

    if (updatedShapes.length > 0) {
      this.props.sampleViewActions.updateShapes(updatedShapes);
    }
  }

  clearSelectionEvent(options) {
    // Single selection if control key is NOT pressed
    if (options.e !== undefined && !options.e.ctrlKey) {
      this.clearSelection();
    } else if (options.e !== undefined) {
      this.deSelectShape(options.deselected);
    }
  }

  saveGrid() {
    const gd = this.drawGridPlugin.saveGrid(
      this.drawGridPlugin.currentGridData(),
    );
    this.props.sampleViewActions.addShape({ t: 'G', ...gd });
    this.drawGridPlugin.reset();
  }

  toggleGridVisibility(id) {
    const grid = this.props.grids[id];

    if (grid.state === 'HIDDEN') {
      grid.state = 'SAVED';
      grid.user_state = 'SAVED';
    } else {
      grid.state = 'HIDDEN';
      grid.user_state = 'HIDDEN';
    }

    this.props.sampleViewActions.updateShapes([grid]);
  }

  centringMessage() {
    let result = null;

    if (this.props.videoMessageOverlay.show) {
      result = (
        <div
          dangerouslySetInnerHTML={{
            __html: this.props.videoMessageOverlay.msg,
          }}
          key={this.props.clickCentringClicksLeft}
          id="video-message-overlay"
        />
      );
    }

    return result;
  }

  createVideoPlayerContainer(format) {
    let source = '/mxcube/api/v0.1/sampleview/camera/subscribe';

    if (this.props.videoURL !== '') {
      source = `${this.props.videoURL}/${this.props.videoHash}`;
    }

    let result = (
      <img id="sample-img" className="img" src={source} alt="SampleView" />
    );

    if (format === 'MPEG1') {
      result = <canvas id="sample-img" className="img" />;
    }

    return result;
  }

  initJSMpeg() {
    if (this.props.videoFormat === 'MPEG1') {
      const canvas = document.querySelector('#sample-img');

      let source =
        this.props.videoURL || `http://${document.location.hostname}:4042/`;

      source = `${source}/${this.props.videoHash}`;

      if (this.player) {
        this.player.stop();
      }

      if (canvas) {
        this.player = new JSMpeg.Player(source, {
          canvas,
          decodeFirstFrame: false,
          preserveDrawingBuffer: false,
          protocols: [],
        });
        this.player.play();
      }

      canvas.src = source;
    }
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  preventAction(e) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  }

  renderSampleView() {
    const {
      imageRatio,
      beamPosition,
      beamShape,
      beamSize,
      clickCentring,
      distancePoints,
      points,
      twoDPoints,
      lines,
      grids,
      pixelsPerMm,
      sourceScale,
    } = this.props;

    this.drawCanvas(imageRatio, sourceScale);
    this.canvas.add(
      ...makeImageOverlay(
        imageRatio,
        pixelsPerMm,
        beamPosition,
        beamShape,
        beamSize,
        clickCentring,
        distancePoints,
        this.canvas,
      ),
    );

    if (
      this.props.clickCentring === false ||
      this.props.clickCentringClicksLeft === 0
    ) {
      this.canvas.remove(this.centringHorizontalLine);
      this.canvas.remove(this.centringVerticalLine);
      this.centringHorizontalLine = undefined;
    }

    if (
      this.props.clickCentring === true &&
      this.centringHorizontalLine !== undefined
    ) {
      this.canvas.add(this.centringHorizontalLine);
      this.canvas.add(this.centringVerticalLine);
    }

    const fabricSelectables = [...makeLines(lines, imageRatio)];

    // Grids already defined (drawn)
    Object.values(grids).forEach((gd) => {
      let gridData = { ...gd };

      if (!this.props.busy && gridData.state !== 'HIDDEN') {
        this.drawGridPlugin.setScale(imageRatio);
        gridData = this.drawGridPlugin.setPixelsPerMM(pixelsPerMm, gridData);
        fabricSelectables.push(
          this.drawGridPlugin.shapeFromGridData(gridData, this.canvas)
            .shapeGroup,
        );
      }
    });

    // Grid beeing defined (being drawn)
    if (this.drawGridPlugin.shapeGroup) {
      fabricSelectables.push(this.drawGridPlugin.shapeGroup);
    }

    // Add points last so they are in front of grids
    fabricSelectables.push(
      ...makePoints(points, imageRatio),
      ...makeTwoDPoints(twoDPoints, imageRatio),
    );

    this.canvas.add(...fabricSelectables);

    // Handle fabric selection logic, create an active group with currently
    // selected shapes, either selected through multiple selection or through
    // single item selection
    const aShapes = [];

    fabricSelectables.forEach((obj) => {
      const shape = obj;
      if (this.props.selectedShapes.includes(shape.id)) {
        aShapes.push(shape);
        shape.active = true;
      }
    });

    const sel = new fabric.ActiveSelection(aShapes, {
      canvas: this.canvas,
      hasRotatingPoint: false,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hoverCursor: 'pointer',
    });

    this.canvas.setActiveObject(sel);
    this.canvas.requestRenderAll();
  }

  render() {
    this.configureGrid();
    this.updateGridResults();

    return (
      <div>
        <div className="outsideWrapper" id="outsideWrapper">
          <div className="insideWrapper" id="insideWrapper">
            <GridForm
              show={this.props.drawGrid}
              getGridOverlayOpacity={this.getGridOverlayOpacity}
              setGridOverlayOpacity={this.setGridOverlayOpacity}
              setHCellSpacing={this.setHCellSpacing}
              setVCellSpacing={this.setVCellSpacing}
              gridList={this.props.grids}
              currentGrid={this.drawGridPlugin.currentGridData()}
              removeGrid={this.props.sampleViewActions.deleteShape}
              saveGrid={this.saveGrid}
              toggleVisibility={this.toggleGridVisibility}
              rotateTo={this.props.sampleViewActions.rotateToShape}
              selectGrid={this.selectShape}
              selectedGrids={this.props.selectedGrids.map((grid) => grid.id)}
            />
            {this.createVideoPlayerContainer(this.props.videoFormat)}

            <SampleControls canvas={this.canvas} />
            <div>{this.centringMessage()}</div>

            <canvas id="canvas" className="coveringCanvas" />
          </div>
        </div>
      </div>
    );
  }
}
