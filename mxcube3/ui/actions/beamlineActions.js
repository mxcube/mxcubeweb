import fetch from 'isomorphic-fetch';
import { RUNNING } from '../constants';
import { checkStatus, parseJSON } from '../requests';

export function setActionState(cmdName, state, data) {
  return { type: 'ACTION_SET_STATE', cmdName, state, data };
}

export function showActionOutput(cmdName) {
  return { type: 'ACTION_SHOW_OUTPUT', cmdName };
}

export function hideActionOutput(cmdName) {
  return { type: 'ACTION_HIDE_OUTPUT', cmdName };
}

export function setArgumentValue(cmdName, argIndex, value) {
  return { type: 'ACTION_SET_ARGUMENT', cmdName, argIndex, value };
}

export function startAction(cmdName, parameters, showOutput = true) {
  const url = `mxcube/api/v0.1/beamline/${cmdName}/run`;

  return (dispatch) => {
    dispatch(setActionState(cmdName, RUNNING));

    if (showOutput) {
      dispatch(showActionOutput(cmdName));
    }

    fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ parameters })
    }).then(checkStatus).then(parseJSON).catch((error) => {
      throw new Error(`GET ${url} failed ${error}`);
    });
  };
}

export function stopAction(cmdName) {
  const url = `mxcube/api/v0.1/beamline/${cmdName}/abort`;

  return () => {
    fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(checkStatus).then(parseJSON).catch((error) => {
      throw new Error(`GET ${url} failed: ${error}`);
    });
  };
}

export function newPlot(plotInfo) {
  return { type: 'NEW_PLOT', plotInfo };
}

export function plotData(plotId, data, fullDataSet) {
  return { type: 'PLOT_DATA', id: plotId, data, fullDataSet };
}

export function plotEnd(data) {
  return { type: 'PLOT_END', id: data.id, data: data.data, dataType: data.type };
}
