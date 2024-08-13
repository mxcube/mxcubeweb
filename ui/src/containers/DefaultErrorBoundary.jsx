import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { store } from '../store';

import { logFrontEndTraceBack } from '../actions/beamline';

class DefaultErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, store: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      store: store.getState(),
    });
    this.props.logFrontEndTraceBack(errorInfo.componentStack);
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div>
          <h3>Something went wrong</h3>
          <p>
            We are terribly sorry but something went wrong, the error has been
            logged. If it remains please contact suport.
          </p>
          <p>
            Simply, <a href="/datacollection">reloading</a> the page might fix
            the issue.
          </p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
            <br />
            {JSON.stringify(this.state.store)}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    logFrontEndTraceBack: bindActionCreators(logFrontEndTraceBack, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DefaultErrorBoundary);
