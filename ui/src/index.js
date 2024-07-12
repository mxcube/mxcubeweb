import 'bootstrap/dist/css/bootstrap.css';
import './main.css';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './components/App';
import { store } from './store';
import DefaultErrorBoundary from './containers/DefaultErrorBoundary';

import '@fortawesome/fontawesome-free/css/all.min.css';

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers', () => {
    const nextReducer = require('./reducers');
    store.replaceReducer(nextReducer);
  });
}

function Root() {
  return (
    <Provider store={store}>
      <DefaultErrorBoundary>
        <App />
      </DefaultErrorBoundary>
    </Provider>
  );
}

ReactDOM.render(<Root />, document.querySelector('#root'));
