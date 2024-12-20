import {
  sendSetAttribute,
  sendExecuteCommand,
  sendPrepareBeamlineForNewSample,
} from '../api/beamline';
import { sendLogFrontEndTraceBack } from '../api/log';

// Action types
export const BL_UPDATE_HARDWARE_OBJECT = 'BL_UPDATE_HARDWARE_OBJECT';
export const BL_UPDATE_HARDWARE_OBJECT_ATTRIBUTE =
  'BL_UPDATE_HARDWARE_OBJECT_ATTRIBUTE';
export const BL_UPDATE_HARDWARE_OBJECT_VALUE =
  'BL_UPDATE_HARDWARE_OBJECT_VALUE';
export const BL_ATTR_GET_ALL = 'BL_ATTR_GET_ALL';
export const BL_UPDATE_HARDWARE_OBJECT_STATE =
  'BL_UPDATE_HARDWARE_OBJECT_STATE';
export const BL_ATTR_MOV_SET_STATE = 'BL_ATTR_MOV_SET_STATE';
export const BL_ATTR_ACT_SET_STATE = 'BL_ATTR_ACT_SET_STATE';
export const BL_ATTR_MOV_SET = 'BL_ATTR_MOV_SET';
export const BL_ATTR_ACT_SET = 'BL_ATTR_ACT_SET';

export function updateBeamlineHardwareObjectAction(data) {
  return { type: BL_UPDATE_HARDWARE_OBJECT, data };
}

export function updateBeamlineHardwareObjectAttributeAction(data) {
  return { type: BL_UPDATE_HARDWARE_OBJECT_ATTRIBUTE, data };
}

export function updateBeamlineHardwareObjectValueAction(data) {
  return { type: BL_UPDATE_HARDWARE_OBJECT_VALUE, data };
}

export function getBeamlineAttrsAction(data) {
  return { type: BL_ATTR_GET_ALL, data };
}

export function updateBeamlineHardwareObjectStateAction(data) {
  return { type: BL_UPDATE_HARDWARE_OBJECT_STATE, data };
}

export function setAttribute(name, value) {
  return (_, getState) => {
    const state = getState();
    const type = state.beamline.hardwareObjects[name].type.toLowerCase();
    sendSetAttribute(name, type, value);
  };
}

export function executeCommand(obj, name, args) {
  return () => {
    sendExecuteCommand(obj, name, args);
  };
}

export function prepareBeamlineForNewSample() {
  return () => sendPrepareBeamlineForNewSample();
}

export function logFrontEndTraceBack(stack) {
  return (_, getState) => {
    sendLogFrontEndTraceBack(stack, getState());
  };
}
