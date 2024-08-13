import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';
import { composeWithDevTools } from '@redux-devtools/extension';

export const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(thunk)),
);

// Enable Hot Module Replacement for reducers
// https://vitejs.dev/guide/api-hmr
if (import.meta.hot) {
  import.meta.hot.accept('./reducers/index.js', (nextReducer) => {
    store.replaceReducer(nextReducer.default);
  });
}
