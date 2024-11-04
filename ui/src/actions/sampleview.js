import { showErrorPanel } from './general';
import {
  sendUpdateAperture,
  sendUpdateCurrentPhase,
} from '../api/diffractometer';
import {
  sendAddOrUpdateShapes,
  sendDeleteShape,
  sendRotateToShape,
  sendSetVideoSize,
  sendRecordCentringClick,
  sendAcceptCentring,
  sendMoveToBeam,
  sendStartClickCentring,
  sendAbortCentring,
  sendMoveToPoint,
} from '../api/sampleview';

export function setMotorMoving(name, status) {
  return { type: 'SET_MOTOR_MOVING', name, status };
}

export function setBeamInfo(info) {
  return { type: 'SET_BEAM_INFO', info };
}

export function setCurrentPhase(phase) {
  return { type: 'SET_CURRENT_PHASE', phase };
}

export function setImageRatio(clientWidth) {
  return { type: 'SET_IMAGE_RATIO', clientWidth };
}

export function setOverlay(level) {
  return { type: 'SET_OVERLAY', level };
}

export function setAperture(size) {
  return { type: 'SET_APERTURE', size };
}

export function setMotorStep(role, value) {
  return { type: 'SET_MOTOR_STEP', role, value };
}

export function showContextMenu(
  show,
  shape = { type: 'NONE' }, // eslint-disable-line unicorn/no-object-as-default-parameter
  pageX = 0,
  pageY = 0,
  imageX = 0,
  imageY = 0,
) {
  return {
    type: 'SHOW_CONTEXT_MENU',
    show,
    shape,
    pageX,
    pageY,
    imageX,
    imageY,
  };
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

export function clearSelectedShapes() {
  return { type: 'CLEAR_SELECTED_SHAPES' };
}

export function addCentringPoint(x, y) {
  return { type: 'ADD_CENTRING_POINT', x, y };
}

export function addShapeAction(shape) {
  return { type: 'ADD_SHAPE', shape };
}

export function updateShapesAction(shapes) {
  return { type: 'UPDATE_SHAPES', shapes };
}

export function deleteShapeAction(id) {
  return { type: 'DELETE_SHAPE', id };
}

export function saveImageSize(width, height, pixelsPerMm) {
  return { type: 'SAVE_IMAGE_SIZE', width, height, pixelsPerMm };
}

export function toggleAutoScale(width = 1) {
  return { type: 'TOGGLE_AUTO_SCALE', width };
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
      beamPosition: json.position,
      sourceScale: json.scale,
    });

    window.initJSMpeg();
  };
}

export function saveMotorPosition(name, value) {
  return { type: 'SAVE_MOTOR_POSITION', name, value };
}

export function updateMotorState(name, value) {
  return { type: 'UPDATE_MOTOR_STATE', name, value };
}

export function setShapes(shapes) {
  return { type: 'SET_SHAPES', shapes };
}

export function toggleCinema() {
  return { type: 'TOOGLE_CINEMA' };
}

export function setGridOverlay(level) {
  return { type: 'SET_GRID_OVERLAY', level };
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

export function centringClicksLeft(clicksLeft) {
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
    const json = await sendRecordCentringClick(x, y);

    const { clicksLeft } = json;
    dispatch(centringClicksLeft(clicksLeft));
    dispatch(
      videoMessageOverlay(
        true,
        `3-Click Centring: <br />${
          clicksLeft === 0
            ? 'Save centring or clicking on screen to restart'
            : `Clicks left: ${clicksLeft}`
        }`,
      ),
    );
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

export function addShape(shapeData = {}, successCb = null) {
  return async (dispatch) => {
    try {
      const json = await sendAddOrUpdateShapes([shapeData]);
      const shape = json.shapes[0];
      dispatch(addShapeAction(shape));

      if (successCb) {
        successCb(shape);
      }
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

export function unselectShapes(shapes) {
  return (dispatch, getState) => {
    const state = getState();

    if (state.login.user.inControl) {
      const _shapes = [];
      if (shapes.shapes !== undefined) {
        const keys = Object.keys(shapes.shapes);
        keys.forEach((k) => {
          const aux = shapes.shapes[k];
          aux.selected = false;
          _shapes.push(aux);
        });
        dispatch(updateShapes(_shapes));
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

export function startClickCentring() {
  return async (dispatch, getState) => {
    const { queue, shapes } = getState();

    dispatch(clearSelectedShapes());
    dispatch(unselectShapes(shapes));

    if (!queue.currentSampleID) {
      dispatch(showErrorPanel(true, 'There is no sample mounted'));
      return;
    }

    const json = await sendStartClickCentring();
    const { clicksLeft } = json;

    dispatch(startClickCentringAction());
    dispatch(centringClicksLeft(clicksLeft));

    const msg = `3-Click Centring: <br />${
      clicksLeft === 0
        ? 'Save centring or clicking on screen to restart'
        : `Clicks left: ${clicksLeft}`
    }`;

    dispatch(videoMessageOverlay(true, msg));
  };
}

export function abortCentring() {
  return async (dispatch) => {
    dispatch(clearSelectedShapes());

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
    await sendUpdateAperture(size);
    dispatch(setAperture(size));
  };
}

export function changeCurrentPhase(phase) {
  return async (dispatch) => {
    await sendUpdateCurrentPhase(phase);
    dispatch(setCurrentPhase(phase));
  };
}
