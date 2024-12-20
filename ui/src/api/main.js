import api from './api';

export function fetchUIProperties() {
  return api.get('/uiproperties').safeJson();
}

export function fetchApplicationSettings() {
  return api.get('/application_settings').safeJson();
}
