import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useSelector } from 'react-redux';

import contextMenu from './reducers/contextMenu';

// Add reducers here once typed
export const store = configureStore({
  reducer: { contextMenu },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

// Enable Hot Module Replacement for reducers
// https://vitejs.dev/guide/api-hmr
if (import.meta.hot) {
  import.meta.hot.accept('./reducers/index.ts', (nextReducer) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    store.replaceReducer(nextReducer?.default);
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
