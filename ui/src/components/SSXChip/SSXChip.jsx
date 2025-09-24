/* eslint-disable react/jsx-key */

/* eslint-disable jsx-a11y/control-has-associated-label */
import 'fabric';
import './ssxchipcontrol.css';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { contextMenu, Item, Menu, Separator } from 'react-contexify';

import MotorInput from '../MotorInput/MotorInput';

const { fabric } = globalThis;

function _GridData(fabricObject) {
  return {
    screenCoord: [fabricObject.top, fabricObject.left],
    top: fabricObject.top,
    left: fabricObject.left,
    width: fabricObject.width,
    height: fabricObject.height,
    cellWidth: fabricObject.width,
    cellHeight: fabricObject.height,
    cellVSpace: 0,
    cellHSpace: 0,
    numCols: 1,
    numRows: 1,
    cellCountFun: null,
    selected: false,
    id: null,
    result: null,
    pixelsPerMMX: 1,
    pixelsPerMMY: 1,
  };
}

function ChipContextMenu({ onMoveTo, onAddTask }) {
  return (
    <Menu id="chip-context-menu">
      <li aria-level="2" className="dropdown-header">
        <b>Chip</b>
      </li>
      <Separator />
      <Item id="moveto" data={{}} onClick={onMoveTo}>
        Move to
      </Item>
      <Item id="addtask" data={{}} onClick={onAddTask}>
        Add to queue
      </Item>
    </Menu>
  );
}

function showContextMenu(event, selection) {
  contextMenu.show({
    id: 'chip-context-menu',
    event: event.e,
    props: {
      selection,
    },
  });
}

function renderChip(
  chipSizeX,
  chipSizeY,
  rows,
  cols,
  blockSizeX,
  blockSizeY,
  spacing,
  offset,
  rowLabels = [],
  colLabels = [],
) {
  const objects = [];

  objects.push(
    new fabric.Rect({
      top: 0,
      left: 0,
      width: chipSizeX,
      height: chipSizeY,
      selectable: false,
      hasControls: false,
      borderColor: '#fff',
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockSkewingX: true,
      lockSkewingY: true,
      lockRotation: true,
      hoverCursor: 'arrow',
      type: 'CHIP',
      objectIndex: [],
    }),
  );

  // Add lables

  for (let ci = 0; ci < cols; ci++) {
    let label = (ci + 1).toString();

    if (colLabels.length > 0) {
      label = colLabels[ci];
    }

    objects.push(
      new fabric.Text(label, {
        top: offset / 2,
        left:
          ci * (blockSizeX + spacing) + offset + blockSizeX + blockSizeX / 4,
        fontSize: blockSizeX * 0.7,
        fontFamily: 'arial',
        fill: '#f55',
        objectCaching: false,
        selectable: false,
        hasControls: false,
        borderColor: '#fff',
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockRotation: true,
        hoverCursor: 'pointer',
        type: 'BLOCK',
      }),
    );
  }

  for (let ri = 0; ri < rows; ri++) {
    let label = (ri + 1).toString();

    if (colLabels.length > 0) {
      label = rowLabels[ri];
    }

    objects.push(
      new fabric.Text(label, {
        top: ri * (blockSizeY + spacing) + offset + blockSizeY,
        left: offset / 2,
        fontSize: blockSizeX * 0.7,
        fontFamily: 'arial',
        fill: '#f55',
        objectCaching: false,
        selectable: false,
        hasControls: false,
        borderColor: '#fff',
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockRotation: true,
        hoverCursor: 'pointer',
        type: 'BLOCK',
      }),
    );
  }

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      objects.push(
        new fabric.Rect({
          top: ri * (blockSizeY + spacing) + offset + blockSizeY,
          left: ci * (blockSizeX + spacing) + offset + blockSizeX,
          width: blockSizeX,
          height: blockSizeY,
          fontFamily: 'arial',
          fill: '#f55',
          objectCaching: false,
          hasControls: false,
          borderColor: '#fff',
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockSkewingX: true,
          lockSkewingY: true,
          lockRotation: true,
          hoverCursor: 'pointer',
          type: 'BLOCK',
          objectIndex: [ri, ci],
        }),
      );
    }
  }

  return objects;
}

// function handleKeyDown(event) {
//   if ([8, 46].includes(event.which)) {
//     freeFormCanvas.remove(freeFormCanvas.getActiveObject());
//     freeFormCanvas.renderAll();
//   }

//   return false;
// }

function initChipCanvas(currentChipLayout) {
  const chipConfig = currentChipLayout.sections[0];

  const numRows = chipConfig.number_of_rows;
  const numCols = chipConfig.number_of_collumns;
  const blockSizeX = chipConfig.block_size[0];
  const blockSizeY = chipConfig.block_size[0];
  const rowLabels = chipConfig.row_labels;
  const colLabels = chipConfig.column_lables;

  const offset = chipConfig.block_spacing[0];
  const spacing = chipConfig.block_spacing[0];

  const numTargetsX = chipConfig.targets_per_block[0];
  const numTargetsY = chipConfig.targets_per_block[1];

  const canvasWidth = numCols * (blockSizeX + spacing) + offset + blockSizeX;
  const canvasHeight = numRows * (blockSizeY + spacing) + offset + blockSizeY;

  const chipCanvas = new fabric.Canvas('chip-canvas', {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: '#CCC',
    preserveObjectStacking: true,
    altSelectionKey: 'ctrlKey',
    selectionKey: 'ctrlKey',
    fireRightClick: true,
    stopContextMenu: true,
    renderOnAddRemove: false,
  });

  const detailCanvas = new fabric.Canvas('chip-detail-canvas', {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: '#CCC',
    preserveObjectStacking: true,
    altSelectionKey: 'ctrlKey',
    selectionKey: 'ctrlKey',
    fireRightClick: true,
    stopContextMenu: true,
    renderOnAddRemove: false,
  });

  chipCanvas.on('mouse:down', (event) => {
    const object = chipCanvas.findTarget(event.e);

    if (event.button === 3) {
      let selection = [];

      if (object.type === 'BLOCK') {
        selection.push(object.objectIndex);
      }

      if (object.type === 'activeSelection') {
        selection = object._objects.map((o) => o.objectIndex);
      }

      if (selection.length > 0) {
        chipCanvas.setActiveObject(object);
        chipCanvas.requestRenderAll();
        showContextMenu(event, selection);
      }
    }
  });

  chipCanvas.on('selection:created', ({ selected, target }) => {
    if (chipCanvas.getActiveObject()) {
      chipCanvas.getActiveObject().lockMovementY = true;
      chipCanvas.getActiveObject().lockMovementX = true;
    }
  });

  chipCanvas.on('selection:updated', ({ selected, target }) => {
    if (chipCanvas.getActiveObject()) {
      chipCanvas.getActiveObject().lockMovementY = true;
      chipCanvas.getActiveObject().lockMovementX = true;
    }
  });

  chipCanvas.add(
    ...renderChip(
      canvasWidth,
      canvasHeight,
      numRows,
      numCols,
      blockSizeX,
      blockSizeY,
      spacing,
      offset,
      rowLabels,
      colLabels,
    ),
  );

  chipCanvas.requestRenderAll();

  detailCanvas.add(
    ...renderChip(
      canvasWidth,
      canvasHeight,
      numTargetsX,
      numTargetsX,
      canvasWidth / numTargetsX - (spacing / numTargetsX) * 4,
      canvasHeight / numTargetsY - (spacing / numTargetsY) * 4,
      spacing / numTargetsX,
      offset,
    ),
  );
  detailCanvas.renderAll();

  return [chipCanvas, detailCanvas];
}

function initFoilCanvas(gridList) {
  const freeFormCanvas = new fabric.Canvas('chip-free-form-canvas', {
    width: 300,
    height: 300,
    backgroundColor: '#CCC',
    preserveObjectStacking: true,
    altSelectionKey: 'ctrlKey',
    selectionKey: 'ctrlKey',
    fireRightClick: true,
    stopContextMenu: true,
    renderOnAddRemove: false,
  });

  freeFormCanvas.on('mouse:down', (event) => {
    const pointer = freeFormCanvas.getPointer(event.e);

    if (!event.e.altKey) {
      return;
    }
    freeFormCanvas.discardActiveObject();

    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      originX: 'left',
      originY: 'top',
      width: 0,
      height: 0,
      angle: 0,
      fill: 'rgba(255,0,0,0.5)',
      transparentCorners: false,
    });

    freeFormCanvas.add(rect);
    freeFormCanvas.setActiveObject(rect);
    freeFormCanvas.renderAll();
  });

  freeFormCanvas.on('mouse:move', (event) => {
    if (!event.e.altKey) {
      return;
    }

    const mouse = freeFormCanvas.getPointer(event);
    const rect = freeFormCanvas.getActiveObject();

    const w = Math.abs(mouse.x - rect.left);
    const h = Math.abs(mouse.y - rect.top);

    if (!w || !h) {
      return;
    }

    rect.set('width', w).set('height', h);

    freeFormCanvas.renderAll();
  });

  // freeFormCanvas.on('mouse:up', (evnt) => {
  //   props.onAddGrid(_GridData(freeFormCanvas.getActiveObject()));
  //   freeFormCanvas.discardActiveObject();
  //   freeFormCanvas.renderAll();
  // });

  gridList.forEach((gridData) => {
    freeFormCanvas.add(
      new fabric.Rect({
        left: gridData.screenCoord[1],
        top: gridData.screenCoord[0],
        originX: 'left',
        originY: 'top',
        width: gridData.width,
        height: gridData.height,
        angle: 0,
        fill: 'rgba(255,0,0,0.5)',
        transparentCorners: false,
      }),
    );
  });

  freeFormCanvas.renderAll();

  return freeFormCanvas;
}

export default function SSXChip(props) {
  const canvasRef = useRef(null);
  const detailCanvasRef = useRef(null);
  const freeFormCanvasRef = useRef(null);
  const currentChipLayout = props.chipLayoutList[props.currentLayoutName];

  debugger;

  const [chipState, setChipState] = useState({
    top_left_x: currentChipLayout.calibration_data.top_left[0],
    top_left_y: currentChipLayout.calibration_data.top_left[1],
    top_left_z: currentChipLayout.calibration_data.top_left[2],
    top_right_x: currentChipLayout.calibration_data.top_right[0],
    top_right_y: currentChipLayout.calibration_data.top_right[1],
    top_right_z: currentChipLayout.calibration_data.top_right[2],
    bottom_left_x: currentChipLayout.calibration_data.bottom_left[0],
    bottom_left_y: currentChipLayout.calibration_data.bottom_left[1],
    bottom_left_z: currentChipLayout.calibration_data.bottom_left[2],
    bottom_right_x: currentChipLayout.calibration_data.bottom_right[0],
    bottom_right_y: currentChipLayout.calibration_data.bottom_right[1],
    bottom_right_z: currentChipLayout.calibration_data.bottom_right[2],
    currentLayoutName: props.currentLayoutName,
  });

  const [_canvas, setCanvas] = useState('');

  const [activePosition, setActivePosition] = useState('');

  const initialCalibratedPos = {
    top_left: [],
    top_right: [],
    bottom_right: [],
    bottom_left: [],
  };

  const [calibratedPositions, setCalibratedPositions] = useState({
    ...initialCalibratedPos,
  });

  function setCalibratedPosition(name) {
    debugger;
    setCalibratedPositions((prevState) => ({
      ...prevState,
      [name]: [
        props.sampleMotorHorizontal.value,
        props.sampleMotorVertical.value,
        props.focusMotor.value,
      ],
    }));
  }

  function initCanvas() {
    const currentChipLayout = props.chipLayoutList[props.currentLayoutName];
    const holderType = currentChipLayout.holder_type;
    let canvas = null;

    if (holderType === 'KNOWN_GEOMETRY') {
      canvas = initChipCanvas(currentChipLayout);
    } else if (holderType === 'FREE_GEOMETRY') {
      canvas = initFoilCanvas(props.gridList);
    }

    return canvas;
  }

  useEffect(() => {
    setCanvas(initCanvas());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInputValueChange(key, event) {
    setChipState((prevState) => ({
      ...prevState,
      [key]: event.target.value,
    }));
  }

  function handleSubmit(key, arg, e) {
    switch (key) {
      case 'move_to': {
        props.setAttribute(
          props.sampleMotorHorizontal.name,
          chipState[`${arg}_x`],
        );
        props.setAttribute(
          props.sampleMotorVertical.name,
          chipState[`${arg}_y`],
        );
        props.setAttribute(props.focusMotor.name, chipState[`${arg}_z`]);
        break;
      }
      case 'top_left': {
        setActivePosition(key);
        break;
      }
      case 'top_right': {
        setActivePosition(key);
        break;
      }
      case 'bottom_left': {
        setActivePosition(key);
        break;
      }
      case 'bottom_right': {
        setActivePosition(key);
        break;
      }
      case 'next': {
        break;
      }
      case 'save': {
        setCalibratedPosition(activePosition);
        break;
      }
      case 'clear': {
        setCalibratedPositions({
          ...calibratedPositions,
          [activePosition]: [],
        });
        break;
      }
      case 'clear_all': {
        setCalibratedPositions({ ...initialCalibratedPos });
        break;
      }
      case 'set_layout': {
        const currentChipLayout = props.chipLayoutList[e.target.value];

        setChipState({
          top_left_x: currentChipLayout.calibration_data.top_left[0],
          top_left_y:
            currentChipLayout.calibration_data.todiffractometer.focusp_left[1],
          top_left_z: currentChipLayout.calibration_data.top_left[1],
          top_right_x: currentChipLayout.calibration_data.top_right[0],
          top_right_y: currentChipLayout.calibration_data.top_right[0],
          top_right_z: currentChipLayout.calibration_data.top_right[1],
          bottom_left_x: currentChipLayout.calibration_data.bottom_left[0],
          bottom_left_y: currentChipLayout.calibration_data.bottom_left[0],
          bottom_left_z: currentChipLayout.calibration_data.bottom_left[1],
          currentLayoutName: e.target.value,
        });

        props.sendExecuteCommand('diffractometer', 'set_chip_layout', {
          layout_name: e.target.value,
        });

        break;
      }
      case 'apply': {
        props.sendExecuteCommand(
          'diffractometer',
          'use_position_for_callibration',
          JSON.stringify({ data: calibratedPositions }),
        );

        break;
      }
      case 'ir_auto_focus': {
        props.sendExecuteCommand('diffractometer', 'ir_auto_focus', {});

        break;
      }
      // No default
    }
  }

  function getButtonVariant(name) {
    if (calibratedPositions[name]?.length > 0) {
      return 'success';
    }

    return activePosition === name ? 'outline-primary' : 'outline-secondary';
  }

  const holderType = currentChipLayout.holder_type;
  const chipVisible = holderType === 'KNOWN_GEOMETRY' ? '' : 'd-none';
  const foilVisible = holderType === 'FREE_GEOMETRY' ? '' : 'd-none';
  const calibratedCount = Object.values(calibratedPositions).filter(
    (arr) => arr.length > 0,
  ).length;

  return (
    <Container className="chip-container">
      <Row>
        <Col xs={8}>
          <Card>
            <Card.Body>
              <div>
                <Row>
                  <Form>
                    <Form.Group as={Row}>
                      <Form.Label column className="col-sm-auto pe-0">
                        <h5>Chip layout:</h5>
                      </Form.Label>
                      <Col className="col-sm-auto pe-0">
                        <Form.Select
                          onChange={(event) =>
                            handleSubmit('set_layout', event)
                          }
                          value={chipState.currentLayoutName}
                        >
                          {props.availableChipLayoutList.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    </Form.Group>
                  </Form>
                </Row>
              </div>
              <div className={chipVisible}>
                <div className="chip-canvas-container">
                  <canvas id="chip-canvas" ref={canvasRef} />
                  <ChipContextMenu {...props} />
                </div>
                <div className="chip-detial-canvas-container">
                  <canvas id="chip-detail-canvas" ref={detailCanvasRef} />
                </div>
              </div>
              <div className={foilVisible}>
                <div className="chip-free-form-canvas-container">
                  <canvas id="chip-free-form-canvas" ref={freeFormCanvasRef} />
                </div>
              </div>
              <Row style={{ 'padding-top': 10 }}>
                <h5>Move to:</h5>
                <Col className="col-sm-auto pe-0">
                  {['top_left', 'top_right', 'bottom_left', 'bottom_right'].map(
                    (name) => (
                      <Button
                        variant="outline-secondary"
                        style={{
                          'text-transform': 'capitalize',
                          'margin-right': 10,
                        }}
                        onClick={(e) => handleSubmit('move_to', name, e)}
                      >
                        {name.replace('_', ' ')}
                      </Button>
                    ),
                  )}
                </Col>
              </Row>
              <Row style={{ 'padding-top': 10 }}>
                <h5>Current position:</h5>
                <Col className="col-sm-auto pe-0">
                  <MotorInput role="sample_horizontal" />
                </Col>
                <Col className="col-sm-auto pe-0">
                  <MotorInput role="sample_vertical" />
                </Col>

                <Col className="col-sm-auto pe-0">
                  <MotorInput role="focus" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xs={8}>
          <Card>
            <Card.Body>
              <Row>
                <Col className="col-sm-auto pe-0">
                  <Button
                    style={{ 'margin-right': 10 }}
                    onClick={(e) => handleSubmit('ir_auto_focus', e)}
                  >
                    IR Auto foucs
                  </Button>
                </Col>
              </Row>
              <Row style={{ 'padding-top': 10 }}>
                <h5>Calibrated positions:</h5>
                <Col className="col-sm-auto pe-0">
                  {['top_left', 'top_right', 'bottom_left', 'bottom_right'].map(
                    (name) => (
                      <Button
                        variant={getButtonVariant(name)}
                        style={{
                          'text-transform': 'capitalize',
                          'margin-right': 10,
                        }}
                        onClick={(e) => handleSubmit(name, e)}
                      >
                        {name.replace('_', ' ')}
                      </Button>
                    ),
                  )}
                </Col>
              </Row>
              <Row style={{ 'padding-top': 20 }}>
                <Col className="col-sm-auto pe-0">
                  <h5>Calibrated {calibratedCount} out of 4</h5>
                </Col>
              </Row>
              <Row style={{ 'padding-top': 10 }}>
                <Col className="col-sm-auto pe-0">
                  <Button onClick={(e) => handleSubmit('save', e)}>
                    Save position
                  </Button>
                </Col>
                <Col className="col-sm-auto pe-0">
                  <Button onClick={(e) => handleSubmit('clear', e)}>
                    Clear
                  </Button>
                </Col>
                <Col className="col-sm-auto pe-0">
                  <Button onClick={(e) => handleSubmit('clear_all', e)}>
                    Clear all
                  </Button>
                </Col>
                <Col className="col-sm-auto pe-0">
                  <Button
                    variant={
                      calibratedCount >= 3 ? 'success' : 'outline-secondary'
                    }
                    onClick={(e) => handleSubmit('apply', e)}
                  >
                    Apply calibration
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
