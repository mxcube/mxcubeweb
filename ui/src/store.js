import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import rootReducer from './reducers';
import { composeWithDevTools } from '@redux-devtools/extension';

const middleware = [
  thunk,
  ...(import.meta.env.VITE_REDUX_LOGGER_ENABLED === 'true'
    ? [createLogger()]
    : []),
];

export const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(...middleware)),
);

// Enable Hot Module Replacement for reducers
// https://vitejs.dev/guide/api-hmr
if (import.meta.hot) {
  import.meta.hot.accept('./reducers/index.js', (nextReducer) => {
    store.replaceReducer(nextReducer.default);
  });
}
