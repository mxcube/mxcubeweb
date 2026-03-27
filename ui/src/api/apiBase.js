import wretch from 'wretch';

import safeJsonAddon from './addons/safeJson';

const baseApi = wretch('/mxcube/api/v0.1')
  .addon(safeJsonAddon())
  .headers({ Accept: 'application/json' });

export default baseApi;
