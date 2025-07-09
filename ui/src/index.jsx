import 'bootstrap/dist/css/bootstrap.css';
import './main.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-contexify/ReactContexify.css';

import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from './components/App';
import DefaultErrorBoundary from './containers/DefaultErrorBoundary';
import { store } from './store';

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
