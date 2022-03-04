import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore } from 'redux-persist';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import {
  createStateSyncMiddleware,
  initMessageListener,
} from 'redux-state-sync';

import { serverIO } from './serverIO';
import rootReducer from './reducers';

function initStore() {
  // Logger MUST BE the last middleware
  const middleware = [thunk, createLogger(), createStateSyncMiddleware()];
  // passing several store enhancers to createStore need to be compose together
  const composedEnhancers = compose(applyMiddleware(...middleware));
  const store = createStore(rootReducer, composedEnhancers);

  initMessageListener(store);

  return store;
}

class ServerStorage {
  constructor(serverIO) {
    this.serverIO = serverIO;
  }

  setItem(key, value) {
    if (store.getState().login.user.inControl) {
      this.serverIO.uiStateSocket.emit('ui_state_set', [key, value]);
    }
  }

  getItem(key, cb) {
    this.serverIO.uiStateSocket.emit('ui_state_get', key, (value) => {
      cb(false, value);
    });
  }

  removeItem(key) {
    this.serverIO.uiStateSocket.emit('ui_state_rm', key);
  }

  getAllKeys(cb) {
    this.serverIO.uiStateSocket.emit('ui_state_getkeys', null, (value) => {
      cb(false, value);
    });
  }
}

function createServerStatePersistor(store, serverIO, cb) {
  return persistStore(
    store,
    {
      blacklist: [
        'remoteAccess',
        'beamline',
        'sampleChanger',
        'form',
        'login',
        'general',
        'logger',
        'shapes',
        'sampleView',
        'taskResult',
        'sampleChangerMaintenance',
        'uiproperties',
      ],
      storage: new ServerStorage(serverIO),
    },
    () => {
      /* eslint-disable react/no-set-state */
      // cb();
      /* eslint-enable react/no-set-state */
    }
  );
}

export const store = initStore();
export const statePersistor = createServerStatePersistor(store, serverIO);
