import { sendExecuteCommand, sendSetValue } from '../api/hardware-object';
import {
  sendAbortCentring,
  sendAcceptCentring,
  sendAddOrUpdateShapes,
  sendDeleteShape,
  sendMoveToBeam,
  sendMoveToPoint,
  sendRecordCentringClick,
  sendRotateToShape,
  sendSetVideoSize,
  sendStartClickCentring,
} from '../api/sampleview';
import {
  addShape as addShapeAction,
  deleteShape as deleteShapeAction,
  updateShapes as updateShapesAction,
} from '../reducers/shapes';
import { showErrorPanel } from './general';

export function setBeamInfo(info) {
  return { type: 'SET_BEAM_INFO', info };
}

export function setCurrentPhase(phase) {
  return { type: 'SET_CURRENT_PHASE', phase };
}

export function setImageRatio(clientWidth) {
  return { type: 'SET_IMAGE_RATIO', clientWidth };
}

function setAperture(size) {
  return { type: 'SET_APERTURE', size };
}

export function setMotorStep(role, value) {
  return { type: 'SET_MOTOR_STEP', role, value };
}

export function setPixelsPerMm(pixelsPerMm) {
  return { type: 'SET_PIXELS_PER_MM', pixelsPerMm };
}

export function measureDistance(mode) {
  return { type: 'MEASURE_DISTANCE', mode };
}

export function addDistancePoint(x, y) {
  return { type: 'ADD_DISTANCE_POINT', x, y };
}

export function startClickCentringAction() {
  return { type: 'START_CLICK_CENTRING' };
}

export function stopClickCentring() {
  return { type: 'STOP_CLICK_CENTRING' };
}

export function videoMessageOverlay(show, msg) {
  return { type: 'SHOW_VIDEO_MESSAGE_OVERLAY', show, msg };
}

export function setVideoSize(width, height) {
  return async (dispatch, getState) => {
    const { sampleview } = getState();
    if (!sampleview.sourceIsScalable) {
      return;
    }

    const json = await sendSetVideoSize(width, height);
    dispatch({
      type: 'SAVE_IMAGE_SIZE',
      width: json.imageWidth,
      height: json.imageHeight,
      pixelsPerMm: json.pixelsPerMm,
      sourceScale: json.scale,
    });
  };
}

export function saveMotorPosition(name, value) {
  return { type: 'SAVE_MOTOR_POSITION', name, value };
}

export function updateMotorState(name, value) {
  return { type: 'UPDATE_MOTOR_STATE', name, value };
}

export function toggleDrawGrid() {
  return async (dispatch, getState) => {
    const { sampleview, queue } = getState();

    // Stop three-click centring if active
    if (sampleview.clickCentring) {
      await dispatch(abortCentring());
    }

    if (!sampleview.drawGrid && !queue.currentSampleID) {
      dispatch(showErrorPanel(true, 'There is no sample mounted'));
      return;
    }

    dispatch({ type: 'DRAW_GRID' });
  };
}

function centringClicksLeft(clicksLeft) {
  return { type: 'CENTRING_CLICKS_LEFT', clicksLeft };
}

export function rotateToShape(sid) {
  return async (dispatch) => {
    try {
      await sendRotateToShape(sid);
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to rotate grid.'));
    }
  };
}

export function recordCentringClick(x, y) {
  return async (dispatch) => {
    let json = {};

    try {
      json = await sendRecordCentringClick(x, y);
    } catch {
      dispatch(showErrorPanel(true, 'Error while centring, please try again'));
      await dispatch(abortCentring());
      return;
    }

    const { clicksLeft } = json;
    dispatch(centringClicksLeft(clicksLeft));

    let msg = `Click Centring: \n`;
    if (clicksLeft === 0) {
      msg += 'Save centring or clicking on screen to restart';
    } else if (clicksLeft === -1) {
      msg += 'Please wait, the centring movement is not completed yet';
    } else {
      msg += `Clicks left: ${clicksLeft}`;
    }
    dispatch(videoMessageOverlay(true, msg));
  };
}

export function acceptCentring() {
  return async (dispatch) => {
    await sendAcceptCentring();
    dispatch(videoMessageOverlay(false, ''));
  };
}

export function moveToBeam(x, y) {
  return () => sendMoveToBeam(x, y);
}

export function add2DPoint(x, y, state) {
  return (dispatch) => {
    return dispatch(addShape({ t: '2DP', screenCoord: [x, y], state }));
  };
}

export function addShape(shapeData = {}) {
  return async (dispatch) => {
    try {
      const json = await sendAddOrUpdateShapes([shapeData]);
      const [shape] = json.shapes;
      dispatch(addShapeAction(shape));
      return shape;
    } catch {
      throw new Error('Server refused to add shape');
    }
  };
}

export function updateShapes(shapes) {
  return async (dispatch) => {
    try {
      const json = await sendAddOrUpdateShapes(shapes);
      dispatch(updateShapesAction(json.shapes));
    } catch {
      throw new Error('Server refused to update shapes');
    }
  };
}

export function deleteShape(id) {
  return async (dispatch) => {
    try {
      await sendDeleteShape(id);
      dispatch(deleteShapeAction(id));
    } catch {
      throw new Error('Server refused to delete shape');
    }
  };
}

function unselectShapes() {
  return (dispatch, getState) => {
    const { shapes, login } = getState();

    if (login.user.inControl) {
      const deselectedShapes = Object.values(shapes.shapes).map((shape) => ({
        ...shape,
        selected: false,
      }));

      if (deselectedShapes.length > 0) {
        dispatch(updateShapes(deselectedShapes));
      }
    }
  };
}

export function toggleCentring() {
  return async (dispatch, getState) => {
    const { sampleview } = getState();

    // Turn off grid drawing if active
    if (sampleview.drawGrid) {
      dispatch({ type: 'DRAW_GRID' });
    }

    if (sampleview.clickCentring) {
      await dispatch(abortCentring());
    } else {
      await dispatch(startClickCentring());
    }
  };
}

function startClickCentring() {
  return async (dispatch, getState) => {
    const { queue, general } = getState();
    dispatch(unselectShapes());

    if (!queue.currentSampleID) {
      dispatch(showErrorPanel(true, 'There is no sample mounted'));
      return;
    }

    const json = await sendStartClickCentring();
    const { clicksLeft } = json;

    dispatch(startClickCentringAction());
    dispatch(centringClicksLeft(clicksLeft));

    const msg = `${general.clickCentringNumClicks}-Click Centring: \n${
      clicksLeft === 0
        ? 'Save centring or clicking on screen to restart'
        : `Clicks left: ${clicksLeft}`
    }`;

    dispatch(videoMessageOverlay(true, msg));
  };
}

export function abortCentring() {
  return async (dispatch) => {
    dispatch(unselectShapes());

    await sendAbortCentring();
    dispatch(stopClickCentring());
    dispatch(videoMessageOverlay(false, ''));
  };
}

export function moveToPoint(id) {
  return async (dispatch) => {
    try {
      await sendMoveToPoint(id);
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to move to point'));
    }
  };
}

export function changeAperture(size) {
  return async (dispatch) => {
    await sendSetValue('beam', 'beam', size);
    dispatch(setAperture(size));
  };
}

export function changeCurrentPhase(phase) {
  return async (dispatch) => {
    await sendExecuteCommand('diffractometer', 'diffractometer', 'set_phase', {
      phase,
    });
    dispatch(setCurrentPhase(phase));
  };
}
