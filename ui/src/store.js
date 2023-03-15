import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import { createStateSyncMiddleware, initMessageListener } from 'redux-state-sync';

import storage from 'redux-persist/lib/storage' // default localStorage for web

import { serverIO } from './serverIO';
import rootReducer from './reducers';

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

function initStore() {
  const config = {
    blacklist: ["persist/PERSIST", "persist/REHYDRATE"]
  };
  // Logger MUST BE the last middleware
  const middleware = [
    thunk,
    createStateSyncMiddleware(config),
    createLogger()
  ];

  const persistConfig = {
    key: 'root',
    blacklist: ['remoteAccess', 'beamline', 'sampleChanger',
      'form', 'general', 'logger', 'shapes', 'login',
      'sampleView', 'taskResult', 'sampleChangerMaintenance', 'uiproperties'],
    storage, // TODO: Find a way to pass the server storage there instead of local storage,
  }

  const persistedReducer = persistReducer(persistConfig, rootReducer);

  const enhancers = [];
  if (process.env.NODE_ENV === 'development') {
    const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;
    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension());
    }
  }

  const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);

  const store = createStore(persistedReducer, composedEnhancers);

  initMessageListener(store);

  return store;
}

function createServerStatePersistor(store, serverIO, cb) {
  return persistStore(store);
}

export const store = initStore();
export const localStatePersistor = persistStore(store);
export const statePersistor = createServerStatePersistor(store, serverIO);