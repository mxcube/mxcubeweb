import api from '.';

export function fetchUIProperties() {
  return api.get('/uiproperties').json();
}

export function fetchApplicationSettings() {
  return api.get('/application_settings').json();
}
