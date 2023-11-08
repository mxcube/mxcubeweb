import { RUNNING } from '../constants';
import {
  sendAbortBeamlineAction,
  sendRunBeamlineAction,
} from '../api/beamline';

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

    sendRunBeamlineAction(cmdName, parameters);
  };
}

export function stopBeamlineAction(cmdName) {
  return () => sendAbortBeamlineAction(cmdName);
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
