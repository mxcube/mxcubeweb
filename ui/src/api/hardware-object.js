import api from './api';

const endpoint = api.url('/hwobj');

export function sendExecuteCommand(objectType, objectId, command, value) {
  return endpoint
    .put(value, `/${objectType}/${objectId}/${command}`)
    .safeJson();
}

export function sendExecuteCommandRaw(objectType, objectId, command, value) {
  return endpoint.put(value, `/${objectType}/${objectId}/${command}`);
}

export function fetchAttribute(objectType, objectId, attributeName) {
  return endpoint.get(`/${objectType}/${objectId}/${attributeName}`).safeJson();
}

export function sendSetValue(objectId, objectType, value) {
  return sendExecuteCommand(objectType, objectId, 'set_value', { value });
}

export function fetchValue(objectId, objectType) {
  return fetchAttribute(objectType, objectId, 'get_value');
}

export function sendStop(objectId, objectType) {
  return sendExecuteCommand(objectType, objectId, 'stop', {});
}
