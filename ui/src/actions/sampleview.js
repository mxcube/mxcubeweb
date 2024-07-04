/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable sonarjs/no-duplicate-string */
import fetch from 'isomorphic-fetch';
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
} from '../api/sampleview';

export function setMotorMoving(name, status) {
  return {
    type: 'SET_MOTOR_MOVING',
    name,
    status,
  };
}

export function setBeamInfo(info) {
  return {
    type: 'SET_BEAM_INFO',
    info,
  };
}

export function setCurrentPhase(phase) {
  return {
    type: 'SET_CURRENT_PHASE',
    phase,
  };
}

export function setImageRatio(clientWidth) {
  return {
    type: 'SET_IMAGE_RATIO',
    clientWidth,
  };
}

export function setOverlay(level) {
  return {
    type: 'SET_OVERLAY',
    level,
  };
}

export function setAperture(size) {
  return {
    type: 'SET_APERTURE',
    size,
  };
}

export function setStepSize(name, value) {
  return {
    type: 'SET_STEP_SIZE',
    componentName: 'sample_view',
    name,
    value,
  };
}

// eslint-disable-next-line unicorn/no-object-as-default-parameter
export function showContextMenu(show, shape = { type: 'NONE' }, x = 0, y = 0) {
  return {
    type: 'SHOW_CONTEXT_MENU',
    show,
    shape,
    x,
    y,
  };
}

export function setPixelsPerMm(pixelsPerMm) {
  return {
    type: 'SET_PIXELS_PER_MM',
    pixelsPerMm,
  };
}

export function measureDistance(mode) {
  return {
    type: 'MEASURE_DISTANCE',
    mode,
  };
}

export function addDistancePoint(x, y) {
  return {
    type: 'ADD_DISTANCE_POINT',
    x,
    y,
  };
}

export function startClickCentring() {
  return {
    type: 'START_CLICK_CENTRING',
  };
}

export function stopClickCentring() {
  return {
    type: 'STOP_CLICK_CENTRING',
  };
}

export function clearSelectedShapes() {
  return {
    type: 'CLEAR_SELECTED_SHAPES',
  };
}

export function addCentringPoint(x, y) {
  return {
    type: 'ADD_CENTRING_POINT',
    x,
    y,
  };
}

export function addShapeAction(shape) {
  return {
    type: 'ADD_SHAPE',
    shape,
  };
}

export function updateShapesAction(shapes) {
  return {
    type: 'UPDATE_SHAPES',
    shapes,
  };
}

export function deleteShapeAction(id) {
  return {
    type: 'DELETE_SHAPE',
    id,
  };
}

export function saveImageSize(width, height, pixelsPerMm) {
  return {
    type: 'SAVE_IMAGE_SIZE',
    width,
    height,
    pixelsPerMm,
  };
}

export function toggleAutoScale(width = 1) {
  return { type: 'TOGGLE_AUTO_SCALE', width };
}

export function videoMessageOverlay(show, msg) {
  return { type: 'SHOW_VIDEO_MESSAGE_OVERLAY', show, msg };
}

export function setVideoSize(width, height) {
  return (dispatch, getState) => {
    const { sampleview } = getState();
    if (!sampleview.sourceIsScalable) {
      return;
    }

    sendSetVideoSize(width, height).then((json) => {
      dispatch({
        type: 'SAVE_IMAGE_SIZE',
        width: json.imageWidth,
        height: json.imageHeight,
        pixelsPerMm: json.pixelsPerMm,
        beamPosition: json.position,
        sourceScale: json.scale,
      });

      window.initJSMpeg();
    });
  };
}

export function saveMotorPosition(name, value) {
  return {
    type: 'SAVE_MOTOR_POSITION',
    name,
    value,
  };
}

export function updateMotorState(name, value) {
  return {
    type: 'UPDATE_MOTOR_STATE',
    name,
    value,
  };
}

export function setShapes(shapes) {
  return {
    type: 'SET_SHAPES',
    shapes,
  };
}

export function toggleCinema() {
  return {
    type: 'TOOGLE_CINEMA',
  };
}

export function setGridOverlay(level) {
  return { type: 'SET_GRID_OVERLAY', level };
}

export function toggleDrawGrid() {
  return { type: 'DRAW_GRID' };
}

export function centringClicksLeft(clicksLeft) {
  return { type: 'CENTRING_CLICKS_LEFT', clicksLeft };
}

export function setGridResultType(gridResultType) {
  return {
    type: 'SET_GRID_RESULT_TYPE',
    gridResultType,
  };
}

export function rotateToShape(sid) {
  return async (dispatch) => {
    try {
      await sendRotateToShape(sid);
    } catch (error) {
      if (error.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to rotate grid.'));
      }
    }
  };
}

export function sendCentringPoint(x, y) {
  return (dispatch) => {
    fetch('/mxcube/api/v0.1/sampleview/centring/click', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ clickPos: { x, y } }),
    })
      .then((response) => response.json())
      .then((json) => {
        const { clicksLeft } = json;
        let msg = '3-Click Centring: <br />';

        dispatch(centringClicksLeft(clicksLeft));

        if (clicksLeft === 0) {
          msg += 'Save centring or clicking on screen to restart';
        } else {
          msg += `Clicks left: ${clicksLeft}`;
        }

        dispatch(videoMessageOverlay(true, msg));
      });
  };
}

export function sendAcceptCentring() {
  return (dispatch) => {
    fetch('/mxcube/api/v0.1/sampleview/centring/accept', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Centring not accepted');
      }
      dispatch(videoMessageOverlay(false, ''));
    });
  };
}

export function sendGoToBeam(x, y) {
  return () => {
    fetch('/mxcube/api/v0.1/sampleview/movetobeam', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ clickPos: { x, y } }),
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused move to beam');
      }
    });
  };
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
    } catch (error) {
      if (error.status >= 400) {
        throw new Error('Server refused to add shape');
      }
    }
  };
}

export function updateShapes(shapes) {
  return async (dispatch) => {
    try {
      const json = await sendAddOrUpdateShapes(shapes);
      dispatch(updateShapesAction(json.shapes));
    } catch (error) {
      if (error.status >= 400) {
        throw new Error('Server refused to update shapes');
      }
    }
  };
}

export function deleteShape(id) {
  return async (dispatch) => {
    try {
      await sendDeleteShape(id);
      dispatch(deleteShapeAction(id));
    } catch (error) {
      if (error.status >= 400) {
        throw new Error('Server refused to delete shape');
      }
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

export function sendStartClickCentring() {
  return (dispatch, getState) => {
    dispatch(clearSelectedShapes());

    const { queue } = getState();
    const { shapes } = getState();
    dispatch(unselectShapes(shapes));

    if (queue.currentSampleID) {
      fetch('/mxcube/api/v0.1/sampleview/centring/start3click', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
        },
      })
        .then((response) => {
          if (response.status >= 400) {
            throw new Error('Server refused to start 3click');
          } else {
            dispatch(startClickCentring());
          }

          return response.json();
        })
        .then((json) => {
          const { clicksLeft } = json;
          dispatch(centringClicksLeft(clicksLeft));

          let msg = '3-Click Centring: <br />';

          if (clicksLeft === 0) {
            msg += 'Save centring or clicking on screen to restart';
          } else {
            msg += `Clicks left: ${clicksLeft}`;
          }

          dispatch(videoMessageOverlay(true, msg));
        });
    } else {
      dispatch(
        showErrorPanel(true, 'There is no sample mounted, cannot center.'),
      );
    }
  };
}

export function sendMotorPosition(motorName, value) {
  return (dispatch) => {
    fetch(`/mxcube/api/v0.1/sampleview/${motorName}/${value}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then((response) => {
      if (response.status === 406) {
        dispatch(showErrorPanel(true, response.headers.get('msg')));
        throw new Error('Server refused to move motors: out of limits');
      }
      if (response.status >= 400) {
        throw new Error('Server refused to move motors');
      }
    });
  };
}

export function sendAbortCentring() {
  return (dispatch) => {
    fetch('/mxcube/api/v0.1/sampleview/centring/abort', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to abort centring'));
      } else {
        dispatch(stopClickCentring());
        dispatch(videoMessageOverlay(false, ''));
      }
    });
    dispatch(clearSelectedShapes());
  };
}

export function sendGoToPoint(id) {
  return (dispatch) => {
    fetch(`/mxcube/api/v0.1/sampleview/centring/${id}/moveto`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to move to point'));
      }
    });
  };
}

export function changeAperture(size) {
  return (dispatch) => {
    sendUpdateAperture(size).then(() => {
      dispatch(setAperture(size));
    });
  };
}

export function changeCurrentPhase(phase) {
  return (dispatch) => {
    sendUpdateCurrentPhase(phase).then(() => {
      dispatch(setCurrentPhase(phase));
    });
  };
}
