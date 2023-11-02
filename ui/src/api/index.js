import wretch from 'wretch';

const api = wretch('/mxcube/api/v0.1')
  .options({ credendials: 'include' })
  .headers({ Accept: 'application/json' });

export default api;
