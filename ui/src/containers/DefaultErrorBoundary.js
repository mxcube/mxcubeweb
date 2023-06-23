import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { store } from '../store';

import {
  sendLogFrontEndTraceBack
} from '../actions/beamline';

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
    })
    this.props.sendLogFrontEndTraceBack(errorInfo, store.getState());
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div>
          <h2>We are sorry, something went wrong</h2>
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
    sendLogFrontEndTraceBack: bindActionCreators(sendLogFrontEndTraceBack, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DefaultErrorBoundary);
