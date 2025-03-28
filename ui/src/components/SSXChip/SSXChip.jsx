/* eslint-disable react/jsx-key */
/* eslint-disable react/no-unused-state */
import React from 'react';
import { Row, Col, Form, Button, Card } from 'react-bootstrap';
import { Menu, Item, Separator, contextMenu } from 'react-contexify';
import 'fabric';
import './ssxchipcontrol.css';

import MotorInput from '../MotorInput/MotorInput';

const { fabric } = window;

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

function ChipContextMenu(props) {
  return (
    <Menu id="chip-context-menu">
      <li role="heading" aria-level="2" className="dropdown-header">
        <b>Chip</b>
      </li>
      <Separator />
      <Item id="moveto" data={{}} onClick={props.onMoveTo}>
        Move to
      </Item>
      <Item id="addtask" data={{}} onClick={props.onAddTask}>
        Add to queue
      </Item>
    </Menu>
  );
}

export default class SSXChip extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.detailCanvasRef = React.createRef();
    this.freeFormCanvasRef = React.createRef();
    this.fc = null;
    this.detailCanvas = null;
    this.freeFormCanvas = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    const currentChipLayout =
      this.props.chipLayoutList[this.props.currentLayoutName];

    this.state = {
      top_left_x: currentChipLayout.calibration_data.top_left[0],
      top_left_y: currentChipLayout.calibration_data.top_left[1],
      top_left_z: currentChipLayout.calibration_data.top_left[1],
      top_right_x: currentChipLayout.calibration_data.top_right[0],
      top_right_y: currentChipLayout.calibration_data.top_right[0],
      top_right_z: currentChipLayout.calibration_data.top_right[1],
      bottom_left_x: currentChipLayout.calibration_data.bottom_left[0],
      bottom_left_y: currentChipLayout.calibration_data.bottom_left[0],
      bottom_left_z: currentChipLayout.calibration_data.bottom_left[1],
      currentLayoutName: this.props.currentLayoutName,
    };

    // Fix
    this.rect = null;
    this.isDown = false;
    this.origX = 0;
    this.origY = 0;
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    const currentChipLayout =
      this.props.chipLayoutList[this.props.currentLayoutName];
    const holderType = currentChipLayout.holder_type;

    if (holderType === 'KNOWN_GEOMETRY') {
      this.initChipCanvas();
    } else if (holderType === 'FREE_GEOMETRY') {
      this.initFoilCanvas();
    }
  }

  componentDidUpdate() {
    const currentChipLayout =
      this.props.chipLayoutList[this.props.currentLayoutName];
    const holderType = currentChipLayout.holder_type;

    if (holderType === 'KNOWN_GEOMETRY') {
      this.initChipCanvas();
    } else if (holderType === 'FREE_GEOMETRY') {
      this.initFoilCanvas();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(event) {
    if ([8, 46].includes(event.which)) {
      this.freeFormCanvas.remove(this.freeFormCanvas.getActiveObject());
      this.freeFormCanvas.renderAll();
    }

    return false;
  }

  handleInputValueChange(key, event) {
    this.setState({ [key]: event.target.value });
  }

  handleSubmit(key, e) {
    switch (key) {
      case 'top_left': {
        this.props.setAttribute(
          this.props.sampleMotorVerticalName,
          this.state.top_left_x,
        );
        this.props.setAttribute(
          this.props.sampleMotorHorizontalName,
          this.state.top_left_y,
        );

        break;
      }
      case 'top_right': {
        this.props.setAttribute(
          this.props.sampleMotorVerticalName,
          this.state.top_right_x,
        );
        this.props.setAttribute(
          this.props.sampleMotorHorizontalName,
          this.state.top_right_y,
        );

        break;
      }
      case 'set_layout': {
        const currentChipLayout = this.props.chipLayoutList[e.target.value];

        this.setState({
          top_left_x: currentChipLayout.calibration_data.top_left[0],
          top_left_y: currentChipLayout.calibration_data.top_left[1],
          top_left_z: currentChipLayout.calibration_data.top_left[1],
          top_right_x: currentChipLayout.calibration_data.top_right[0],
          top_right_y: currentChipLayout.calibration_data.top_right[0],
          top_right_z: currentChipLayout.calibration_data.top_right[1],
          bottom_left_x: currentChipLayout.calibration_data.bottom_left[0],
          bottom_left_y: currentChipLayout.calibration_data.bottom_left[0],
          bottom_left_z: currentChipLayout.calibration_data.bottom_left[1],
          currentLayoutName: e.target.value,
        });

        this.props.sendExecuteCommand('diffractometer', 'set_chip_layout', {
          layout_name: e.target.value,
        });

        break;
      }
      // No default
    }
  }

  showContextMenu(event, selection) {
    contextMenu.show({
      id: 'chip-context-menu',
      event: event.e,
      position: {
        x: event.e.offsetX + 15,
        y: event.e.offsetY + 55,
      },
      props: {
        selection,
      },
    });
  }

  renderChip(
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

  initChipCanvas() {
    const currentChipLayout =
      this.props.chipLayoutList[this.props.currentLayoutName];
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

    const canvas = new fabric.Canvas('chip-canvas', {
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

    this.fc = canvas;
    this.detailCanvas = detailCanvas;

    this.fc.on('mouse:down', (event) => {
      const object = canvas.findTarget(event.e);

      if (event.button === 3) {
        let selection = [];

        if (object.type === 'BLOCK') {
          selection.push(object.objectIndex);
        }

        if (object.type === 'activeSelection') {
          selection = object._objects.map((o) => o.objectIndex);
        }

        if (selection.length > 0) {
          this.fc.setActiveObject(object);
          this.fc.requestRenderAll();
          this.showContextMenu(event, selection);
        }
      }
    });

    this.fc.on('selection:created', () => {
      if (this.fc.getActiveObject()) {
        this.fc.getActiveObject().lockMovementY = true;
        this.fc.getActiveObject().lockMovementX = true;
      }
    });

    this.fc.on('selection:updated', () => {
      if (this.fc.getActiveObject()) {
        this.fc.getActiveObject().lockMovementY = true;
        this.fc.getActiveObject().lockMovementX = true;
      }
    });

    this.fc.add(
      ...this.renderChip(
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

    this.fc.requestRenderAll();

    this.detailCanvas.add(
      ...this.renderChip(
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
    this.detailCanvas.renderAll();
  }

  initFoilCanvas() {
    const freeFormCanvas = new fabric.Canvas('chip-free-form-canvas', {
      width: 500,
      height: 500,
      backgroundColor: '#CCC',
      preserveObjectStacking: true,
      altSelectionKey: 'ctrlKey',
      selectionKey: 'ctrlKey',
      fireRightClick: true,
      stopContextMenu: true,
      renderOnAddRemove: false,
    });

    this.freeFormCanvas = freeFormCanvas;

    this.freeFormCanvas.on('mouse:down', (event) => {
      const pointer = this.freeFormCanvas.getPointer(event.e);

      if (!event.e.altKey) {
        return;
      }
      this.freeFormCanvas.discardActiveObject();

      this.isDown = true;

      this.rect = new fabric.Rect({
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

      this.freeFormCanvas.add(this.rect);
      this.freeFormCanvas.setActiveObject(this.rect);
      this.freeFormCanvas.renderAll();
    });

    this.freeFormCanvas.on('mouse:move', (event) => {
      if (!this.isDown && !event.e.altKey) {
        return;
      }

      const mouse = this.freeFormCanvas.getPointer(event);
      const rect = this.freeFormCanvas.getActiveObject();

      const w = Math.abs(mouse.x - rect.left);
      const h = Math.abs(mouse.y - rect.top);

      if (!w || !h) {
        return;
      }

      rect.set('width', w).set('height', h);

      this.freeFormCanvas.renderAll();
    });

    this.freeFormCanvas.on('mouse:up', () => {
      if (this.isDown) {
        this.isDown = false;
        this.props.onAddGrid(_GridData(this.freeFormCanvas.getActiveObject()));
        this.freeFormCanvas.discardActiveObject();
        this.freeFormCanvas.renderAll();
      }
    });

    this.props.gridList.forEach((gridData) => {
      this.freeFormCanvas.add(
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

    this.freeFormCanvas.renderAll();
  }

  renderChipInterface() {
    return [
      <div className="chip-canvas-container">
        <canvas id="chip-canvas" ref={this.canvasRef} />
        <ChipContextMenu {...this.props} />
      </div>,
      <div className="chip-detial-canvas-container">
        <canvas id="chip-detail-canvas" ref={this.detailCanvasRef} />
      </div>,
    ];
  }

  render() {
    const currentChipLayout =
      this.props.chipLayoutList[this.props.currentLayoutName];
    const holderType = currentChipLayout.holder_type;

    const chipVisible = holderType === 'KNOWN_GEOMETRY' ? '' : 'd-none';
    const foilVisible = holderType === 'FREE_GEOMETRY' ? '' : 'd-none';

    return (
      <div className="chip-container">
        <Row>
          <Col>
            <div className={chipVisible}>
              <div className="chip-canvas-container">
                <canvas id="chip-canvas" ref={this.canvasRef} />
                <ChipContextMenu {...this.props} />
              </div>
              <div className="chip-detial-canvas-container">
                <canvas id="chip-detail-canvas" ref={this.detailCanvasRef} />
              </div>
            </div>
            <div className={foilVisible}>
              <div className="chip-free-form-canvas-container">
                <canvas
                  id="chip-free-form-canvas"
                  ref={this.freeFormCanvasRef}
                />
              </div>
            </div>
          </Col>
          <Col>
            <Card>
              <Card.Body>
                <div>
                  <h5>Current position:</h5>
                  <Row>
                    <Col className="col-sm-auto pe-0">
                      <MotorInput role="sample_vertical" />
                    </Col>
                    <Col className="col-sm-auto pe-0">
                      <MotorInput role="sample_horizontal" />
                    </Col>
                  </Row>
                </div>
                <div />
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div>
                  <Row>
                    <Form>
                      <Form.Group as={Row} className="gx-4">
                        <Form.Label column className="col-sm-auto pe-0">
                          <h5>Current chip layout:</h5>
                        </Form.Label>
                        <Col xs={6}>
                          <Form.Select
                            onChange={(event) =>
                              this.handleSubmit('set_layout', event)
                            }
                            value={this.state.currentLayoutName}
                          >
                            {this.props.availableChipLayoutList.map((item) => (
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
                <div>
                  <h5>Top left:</h5>
                  <Form>
                    <Form.Group as={Row} className="gx-4">
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>X:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('top_left_x', event)
                          }
                          value={this.state.top_left_x}
                          id="top_left_x"
                        />
                      </Col>
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>Y:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('top_left_y', event)
                          }
                          value={this.state.top_left_y}
                          id="top_left_y"
                        />
                      </Col>
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>Z:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('top_left_z', event)
                          }
                          value={this.state.top_left_y}
                          id="top_left_z"
                        />
                      </Col>
                      <Col className="d-flex  justify-content-end">
                        <Button
                          onClick={(e) => this.handleSubmit('top_left', e)}
                        >
                          Go to
                        </Button>
                      </Col>
                    </Form.Group>
                  </Form>
                </div>
                <div>
                  <h5>Top right:</h5>
                  <Form>
                    <Form.Group as={Row} className="mb-3 gx-4">
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>X:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('top_right_x', event)
                          }
                          value={this.state.top_right_x}
                          id="top_right_x"
                        />
                      </Col>
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>Y:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('top_right_y', event)
                          }
                          value={this.state.top_right_y}
                          id="top_right_y"
                        />
                      </Col>
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>Z:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('top_right_z', event)
                          }
                          value={this.state.top_right_y}
                          id="top_right_z"
                        />
                      </Col>
                      <Col className="d-flex justify-content-end">
                        <Button
                          onClick={(e) => this.handleSubmit('top_right', e)}
                        >
                          Go to
                        </Button>
                      </Col>
                    </Form.Group>
                  </Form>
                </div>
                <div>
                  <h5>Bottom left:</h5>
                  <Form>
                    <Form.Group as={Row} className="mb-3 gx-4">
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>X:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('bottom_left_x', event)
                          }
                          value={this.state.top_right_x}
                          id="bottom_left_x"
                        />
                      </Col>
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>Y:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('bottom_left_y', event)
                          }
                          value={this.state.top_right_y}
                          id="bottom_left_y"
                        />
                      </Col>
                      <Form.Label column className="col-sm-auto pe-0">
                        <strong>Z:</strong>
                      </Form.Label>
                      <Col xs={2}>
                        <Form.Control
                          onChange={(event) =>
                            this.handleInputValueChange('bottom_left_z', event)
                          }
                          value={this.state.top_right_y}
                          id="bottom_left_z"
                        />
                      </Col>
                      <Col className="d-flex justify-content-end">
                        <Button
                          onClick={(e) => this.handleSubmit('bottom_left', e)}
                        >
                          Go to
                        </Button>
                      </Col>
                    </Form.Group>
                  </Form>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}
