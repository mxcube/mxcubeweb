import api from './api';

const endpoint = api.url('/hwobj');

export function sendExecuteCommand(objectType, objectId, command, args) {
  return endpoint.put({ args }, `/${objectType}/${objectId}/${command}`).res();
}

export function sendSetAttribute(objectId, type, value) {
  return endpoint.put({ value }, `/${type}/${objectId}/set_value`).res();
}

export function sendGetAttribute(objectId, type) {
  return endpoint.put({}, `/${type}/${objectId}/get_value`).res();
}
