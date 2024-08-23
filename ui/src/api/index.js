import wretch from 'wretch';
import safeJsonAddon from './addons/safeJson';

const api = wretch('/mxcube/api/v0.1')
  .addon(safeJsonAddon())
  .options({ credendials: 'include' })
  .headers({ Accept: 'application/json' });

export default api;
