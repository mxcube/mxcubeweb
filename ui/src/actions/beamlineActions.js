import {
  sendExecuteCommand,
  sendGetAttribute,
  sendStop,
} from '../api/hardware-object';
import { RUNNING } from '../constants';

export function addUserMessage(data) {
  return {
    type: 'ADD_USER_MESSAGE',
    data,
  };
}

export function setActionState(cmdName, state, data) {
  return {
    type: 'ACTION_SET_STATE',
    cmdName,
    state,
    data,
  };
}

export function showActionOutput(cmdName) {
  return { type: 'ACTION_SHOW_OUTPUT', cmdName };
}

export function hideActionOutput(cmdName) {
  return { type: 'ACTION_HIDE_OUTPUT', cmdName };
}

export function setArgumentValue(cmdName, argIndex, value) {
  return {
    type: 'ACTION_SET_ARGUMENT',
    cmdName,
    argIndex,
    value,
  };
}

export function startBeamlineAction(cmdName, parameters, showOutput = true) {
  return (dispatch) => {
    dispatch(setActionState(cmdName, RUNNING));

    if (showOutput) {
      dispatch(showActionOutput(cmdName));
    }

    sendExecuteCommand('beamlineaction', 'beamline_actions', 'run_action', {
      cmd: cmdName,
      parameters,
    });
  };
}

export function fetchGetAllActions() {
  return sendGetAttribute(
    'beamlineaction',
    'beamline_actions',
    'get_all_actions',
  );
}

export function stopBeamlineAction(name) {
  return async (_, getState) => {
    const state = getState();
    const type = state.beamline.hardwareObjects[name].type.toLowerCase();
    await sendStop(name, type);
  };
}

export function newPlot(plotInfo) {
  return { type: 'NEW_PLOT', plotInfo };
}

export function plotData(plotId, data, fullDataSet) {
  return {
    type: 'PLOT_DATA',
    id: plotId,
    data,
    fullDataSet,
  };
}

export function plotEnd(data) {
  return {
    type: 'PLOT_END',
    id: data.id,
    data: data.data,
    dataType: data.type,
  };
}
