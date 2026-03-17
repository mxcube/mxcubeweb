import 'bootstrap/dist/css/bootstrap.css';
import './main.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-contexify/ReactContexify.css';

import { createRoot } from 'react-dom/client';
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

const root = createRoot(document.querySelector('#root'));
root.render(<Root />);
