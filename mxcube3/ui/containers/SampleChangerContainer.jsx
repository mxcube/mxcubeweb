import React from 'react';
import { connect } from 'react-redux';

import { select, loadSample, unloadSample, scan,
refresh } from '../actions/sampleChanger';

import SampleChanger from '../components/SampleChanger/SampleChanger';

class SampleChangerContainer extends React.Component {
  render() {
    return (<SampleChanger
      state={this.props.state}
      select={this.props.select}
      load={this.props.loadSample}
      unload={this.props.unloadSample}
      scan={this.props.scan}
      contents={this.props.contents}
      refresh={this.props.refresh}
    />);
  }
}

function mapStateToProps(state) {
  return {
    contents: state.sampleChanger.contents,
    state: state.sampleChanger.state
  };
}

function mapDispatchToProps(dispatch) {
  return {
    select: (address) => dispatch(select(address)),
    loadSample: (address) => dispatch(loadSample(address)),
    unloadSample: (address) => dispatch(unloadSample(address)),
    scan: (container) => dispatch(scan(container)),
    refresh: () => dispatch(refresh())
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleChangerContainer);

