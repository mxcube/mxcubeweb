import { Button } from 'react-bootstrap';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch } from 'react-redux';

import { logFrontEndTraceBack } from '../actions/beamline';

function DefaultErrorBoundary(props) {
  const { children } = props;
  const dispatch = useDispatch();

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div className="p-4">
          <h3 className="mb-3">Something went wrong</h3>
          <p className="mb-2">
            We are terribly sorry but an error occurred:{' '}
            <code>{error?.toString()}</code>
          </p>
          <p>
            Reloading the page might fix the issue. If it remains, please
            contact support.
          </p>
          <Button onClick={() => globalThis.location.reload()}>Reload</Button>
        </div>
      )}
      onError={(_, { componentStack }) => {
        dispatch(logFrontEndTraceBack(componentStack));
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default DefaultErrorBoundary;
