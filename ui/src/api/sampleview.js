import {
  fetchAttribute,
  sendExecuteCommand,
  sendExecuteCommandRaw,
} from './hardware-object';

function fetchSampleViewAttribute(attribute) {
  return fetchAttribute('sample_view', 'sample_view', attribute);
}

function sendSampleViewCommand(command, params = {}) {
  return sendExecuteCommand('sample_view', 'sample_view', command, params);
}

export function fetchImageData() {
  return fetchSampleViewAttribute('sample_image_meta_data');
}

export function sendSetVideoSize(width, height) {
  return sendSampleViewCommand('set_image_size', {
    width,
    height,
  });
}

export function fetchShapes() {
  return fetchSampleViewAttribute('shapes');
}

export function sendAddOrUpdateShapes(shapes) {
  return sendSampleViewCommand('update_shapes', {
    shapes,
  });
}

export function sendDeleteShape(sid) {
  return sendSampleViewCommand('delete_shape', {
    sid,
  });
}

export function sendRotateToShape(sid) {
  return sendSampleViewCommand('rotate_to', {
    sid,
  });
}

export function sendSetCentringMethod(method) {
  sendSampleViewCommand('set_centring_method', {
    method,
  });
}

export function sendStartClickCentring() {
  return sendSampleViewCommand('start_click_centring', {});
}

export function sendRecordCentringClick(x, y) {
  return sendSampleViewCommand('click', { x, y });
}

export function sendAcceptCentring() {
  return sendSampleViewCommand('accept_centring', {});
}

export function sendAbortCentring() {
  return sendSampleViewCommand('abort_centring', {});
}

export function sendMoveToPoint(point_id) {
  return sendSampleViewCommand('move_to_centred_position', { point_id });
}

export function sendMoveToBeam(x, y) {
  return sendSampleViewCommand('move_to_beam', {
    x,
    y,
  });
}

export function sendTakeSnapshot(canvasData) {
  return sendExecuteCommandRaw('sample_view', 'sample_view', 'snapshot', {
    value: canvasData,
  }).blob();
}
