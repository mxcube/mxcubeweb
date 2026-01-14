/* eslint-disable react/jsx-key */

import { createSelector } from '@reduxjs/toolkit';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { executeCommand, setAttribute } from '../../actions/beamline';
import { showTaskForm } from '../../actions/taskForm';
import MotorInput from '../MotorInput/MotorInput';
import { initChipCanvas, initFoilCanvas } from './ChipCanvasUtils';
import ChipContextMenu from './ChipContextMenu';
import styles from './ssxchipcontrol.module.css';

function selectShapes(state) {
  return state.shapes;
}

const selectGrids = createSelector([selectShapes], (shapes = {}) => {
  const grids = {};

  Object.values(shapes).forEach((shape) => {
    if (shape.t === 'G') {
      grids[shape.id] = shape;
    }
  });

  return Object.values(grids);
});

export default function SSXChip() {
  const canvasRef = useRef(null);
  const detailCanvasRef = useRef(null);
  const freeFormCanvasRef = useRef(null);

  const dispatch = useDispatch();
  const currentSampleID = useSelector((state) => state.queue.currentSampleID);
  const sampleData = useSelector(
    (state) => state.sampleGrid.sampleList[currentSampleID],
  );
  const defaultParameters = useSelector(
    (state) => state.taskForm.defaultParameters,
  );
  const groupFolder = useSelector((state) => state.queue.groupFolder);
  const gridList = useSelector(selectGrids);
  const hardwareObjects = useSelector(
    (state) => state.beamline.hardwareObjects,
  );
  const uiproperties = useSelector(
    (state) => state.uiproperties.sample_view_motors,
  );

  const sampleVerticalUiProp = uiproperties.components.find(
    (el) => el.role === 'sample_vertical',
  );

  const sampleHorizontalUiProp = uiproperties.components.find(
    (el) => el.role === 'sample_horizontal',
  );

  const focus = uiproperties.components.find((el) => el.role === 'focus');

  const sampleMotorVertical = hardwareObjects[sampleVerticalUiProp.attribute];
  const sampleMotorHorizontal =
    hardwareObjects[sampleHorizontalUiProp.attribute];
  const focusMotor = hardwareObjects[focus.attribute];

  const headConfiguration =
    hardwareObjects.diffractometer.attributes.head_configuration ?? {};

  const chipLayoutList = headConfiguration.available;
  const _chipLayout = chipLayoutList[headConfiguration.current];

  const [chipState, setChipState] = useState({
    top_left_x: _chipLayout.calibration_data.top_left[0],
    top_left_y: _chipLayout.calibration_data.top_left[1],
    top_left_z: _chipLayout.calibration_data.top_left[2],
    top_right_x: _chipLayout.calibration_data.top_right[0],
    top_right_y: _chipLayout.calibration_data.top_right[1],
    top_right_z: _chipLayout.calibration_data.top_right[2],
    bottom_left_x: _chipLayout.calibration_data.bottom_left[0],
    bottom_left_y: _chipLayout.calibration_data.bottom_left[1],
    bottom_left_z: _chipLayout.calibration_data.bottom_left[2],
    bottom_right_x: _chipLayout.calibration_data.bottom_right[0],
    bottom_right_y: _chipLayout.calibration_data.bottom_right[1],
    bottom_right_z: _chipLayout.calibration_data.bottom_right[2],
    currentLayoutName: headConfiguration.current,
  });

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
    setCalibratedPositions((prevState) => ({
      ...prevState,
      [name]: [
        sampleMotorHorizontal.value,
        sampleMotorVertical.value,
        focusMotor.value,
      ],
    }));
  }

  function handleAddTask(triggerEvent) {
    const sid = -1;

    dispatch(
      showTaskForm(
        'Generic',
        [currentSampleID],
        {
          parameters: {
            ...defaultParameters.ssx_chip_collection.acq_parameters,
            name: 'SSX Collection',
            prefix: sampleData.defaultPrefix,
            subdir: `${groupFolder}${sampleData.defaultSubDir}`,
            cell_count: 0,
            numRows: 0,
            numCols: 0,
            selection: triggerEvent.props.selection,
          },
          type: 'ssx_chip_collection',
        },
        sid,
      ),
    );
  }

  function initCanvas() {
    const holderType = chipLayoutList[chipState.currentLayoutName].holder_type;
    let canvas = null;

    if (holderType === 'KNOWN_GEOMETRY') {
      canvas = initChipCanvas(chipLayoutList[chipState.currentLayoutName]);
    } else if (holderType === 'FREE_GEOMETRY') {
      canvas = initFoilCanvas(gridList);
    }

    return canvas;
  }

  useEffect(() => {
    initCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipState]);

  function handleSubmit(key, e, arg) {
    switch (key) {
      case 'move_to': {
        dispatch(
          setAttribute(sampleMotorHorizontal.name, chipState[`${arg}_x`]),
        );
        dispatch(setAttribute(sampleMotorVertical.name, chipState[`${arg}_y`]));
        dispatch(setAttribute(focusMotor.name, chipState[`${arg}_z`]));
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
        const chipLayout = chipLayoutList[e.target.value];

        setChipState({
          top_left_x: chipLayout.calibration_data.top_left[0],
          top_left_y: chipLayout.calibration_data.top_left[1],
          top_left_z: chipLayout.calibration_data.top_left[2],
          top_right_x: chipLayout.calibration_data.top_right[0],
          top_right_y: chipLayout.calibration_data.top_right[1],
          top_right_z: chipLayout.calibration_data.top_right[2],
          bottom_left_x: chipLayout.calibration_data.bottom_left[0],
          bottom_left_y: chipLayout.calibration_data.bottom_left[1],
          bottom_left_z: chipLayout.calibration_data.bottom_left[2],
          currentLayoutName: e.target.value,
        });

        dispatch(
          executeCommand(
            'diffractometer',
            'diffractometer',
            'set_chip_layout',
            {
              layout_name: e.target.value,
            },
          ),
        );

        break;
      }
      case 'apply': {
        dispatch(
          executeCommand(
            'diffractometer',
            'diffractometer',
            'use_position_for_calibration',
            { data: calibratedPositions },
          ),
        );

        break;
      }
      case 'ir_auto_focus': {
        dispatch(
          executeCommand(
            'diffractometer',
            'diffractometer',
            'ir_auto_focus',
            {},
          ),
        );

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

  const holderType = chipLayoutList[chipState.currentLayoutName].holder_type;
  const chipVisible = holderType === 'KNOWN_GEOMETRY' ? '' : 'd-none';
  const foilVisible = holderType === 'FREE_GEOMETRY' ? '' : 'd-none';
  const calibratedCount = Object.values(calibratedPositions).filter(
    (arr) => arr.length > 0,
  ).length;

  return (
    <Container className="chip-container">
      <Row>
        <Col xs={12}>
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
                          {Object.keys(headConfiguration.available).map(
                            (item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ),
                          )}
                        </Form.Select>
                      </Col>
                    </Form.Group>
                  </Form>
                </Row>
              </div>
              <div className={chipVisible}>
                <div className={styles.chipCanvasContainer}>
                  <canvas
                    aria-label="chip-canvas"
                    id="chip-canvas"
                    ref={canvasRef}
                  />
                  <ChipContextMenu onAddTask={handleAddTask} />
                </div>
                <div className={styles.chipCanvasContainer}>
                  <canvas
                    aria-label="chip-detials-canvas"
                    id="chip-detail-canvas"
                    ref={detailCanvasRef}
                  />
                </div>
              </div>
              <div className={foilVisible}>
                <div className="chip-free-form-canvas-container">
                  <canvas
                    aria-label="chip-free-form-canvas"
                    id="chip-free-form-canvas"
                    ref={freeFormCanvasRef}
                  />
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
                        onClick={(e) => handleSubmit('move_to', e, name)}
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
        <Col xs={12}>
          <Card>
            <Card.Body>
              <Row>
                <h5>Chip calibratation:</h5>
              </Row>
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
