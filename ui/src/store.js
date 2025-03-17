import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import rootReducer from './reducers';

const middleware = [
  ...(import.meta.env.VITE_REDUX_LOGGER_ENABLED === 'true'
    ? [createLogger()]
    : []),
];

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware({
      immutableCheck: false,
    }),
    ...middleware,
  ],
});

// Enable Hot Module Replacement for reducers
// https://vitejs.dev/guide/api-hmr
if (import.meta.hot) {
  import.meta.hot.accept('./reducers/index.js', (nextReducer) => {
    store.replaceReducer(nextReducer.default);
  });
}
