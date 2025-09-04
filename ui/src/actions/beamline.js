import { sendExecuteCommand, sendSetValue } from '../api/hardware-object';
import { sendLogFrontEndTraceBack } from '../api/log';

export function updateBeamlineHardwareObjectAction(data) {
  return { type: 'BL_UPDATE_HARDWARE_OBJECT', data };
}

export function updateBeamlineHardwareObjectAttributeAction(data) {
  return { type: 'BL_UPDATE_HARDWARE_OBJECT_ATTRIBUTE', data };
}

export function updateBeamlineHardwareObjectValueAction(data) {
  return { type: 'BL_UPDATE_HARDWARE_OBJECT_VALUE', data };
}

export function setAttribute(name, value) {
  return async (_, getState) => {
    const state = getState();
    const type = state.beamline.hardwareObjects[name].type.toLowerCase();
    await sendSetValue(name, type, value);
  };
}

export function executeCommand(object_type, object_id, name, args) {
  return () => {
    sendExecuteCommand(object_type, object_id, name, args);
  };
}

export function prepareBeamlineForNewSample() {
  return () =>
    sendExecuteCommand(
      'beamline',
      'beamline',
      'prepare_beamline_for_sample',
      {},
    );
}

export function logFrontEndTraceBack(stack) {
  return (_, getState) => {
    sendLogFrontEndTraceBack(stack, getState());
  };
}
