import React from 'react';
import { connect } from 'react-redux';

import { select, loadSample, unloadSample, scan, abort, sendCommand,
refresh } from '../actions/sampleChanger';

import SampleChanger from '../components/SampleChanger/SampleChanger';
import SampleChangerState from '../components/SampleChanger/SampleChangerState';
import SampleChangerMaintenance from '../components/SampleChanger/SampleChangerMaintenance';

class SampleChangerContainer extends React.Component {
  render() {
    return (<div className="row">
      <div className="col-xs-12" style={{ marginTop: '-20px' }}>
          <div className="row">
           <div className="col-xs-12" style={{ marginTop: '1em' }}>
            <SampleChangerState
              state={this.props.state}
            />
           </div>
          </div>
          <div className="row">
           <div className="col-xs-6">
             <SampleChanger
               state={this.props.state}
               loadedSample={this.props.loadedSample}
               select={this.props.select}
               load={this.props.loadSample}
               unload={this.props.unloadSample}
               abort={this.props.abort}
               scan={this.props.scan}
               contents={this.props.contents}
               refresh={this.props.refresh}
             />
           </div>
           <div className="col-xs-6">
             <SampleChangerMaintenance
               commands={this.props.commands}
               global_state={this.props.global_state}
               commands_state={this.props.commands_state}
               message={this.props.message}
               send_command={this.props.sendCommand}
             />
           </div>
          </div>
      </div>
      </div>);
  }
}

function mapStateToProps(state) {
  return {
    contents: state.sampleChanger.contents,
    state: state.sampleChanger.state,
    loadedSample: state.sampleChanger.loadedSample,
    commands: state.sampleChangerMaintenance.commands,
    commands_state: state.sampleChangerMaintenance.commands_state,
    global_state: state.sampleChangerMaintenance.global_state,
    message: state.sampleChangerMaintenance.message
  };
}

function mapDispatchToProps(dispatch) {
  return {
    select: (address) => dispatch(select(address)),
    loadSample: (address) => dispatch(loadSample(address)),
    unloadSample: (address) => dispatch(unloadSample(address)),
    scan: (container) => dispatch(scan(container)),
    refresh: () => dispatch(refresh()),
    abort: () => dispatch(abort()),
    sendCommand: (cmd) => dispatch(sendCommand(cmd))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleChangerContainer);

