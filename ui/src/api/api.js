/* eslint-disable promise/prefer-await-to-callbacks */
import { store } from '../store';
import baseApi from './apiBase';
import { fetchLoginInfo } from './loginBase';

const api = baseApi
  .options({ credendials: 'include' })
  .catcher(401, async (error) => {
    // User got logged out somehow: refetch login info to update local state and redirect to login page.
    // Don't use `getLoginInfo` action to avoid import cycle.
    const loginInfo = await fetchLoginInfo();
    store.dispatch({ type: 'SET_LOGIN_INFO', loginInfo });
    throw error;
  });

export default api;
