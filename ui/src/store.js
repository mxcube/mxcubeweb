import { createStore, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

function initStore() {
  // Logger MUST BE the last middleware
  const middleware = [
    thunk,
    createLogger()
  ];

  const enhancers = [];
  if (process.env.NODE_ENV === 'development') {
    const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;
    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension());
    }
  }

  const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);

  return createStore(rootReducer, composedEnhancers);
}

export const store = initStore();
