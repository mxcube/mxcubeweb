import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {Container, Row, Col} from 'react-bootstrap';

import {
  select, loadSample, unloadSample, scan, abort, sendCommand, refresh
} from '../actions/sampleChanger';

import {
  executeCommand,
} from '../actions/beamline';

import SampleChanger from '../components/Equipment/SampleChanger';
import EquipmentState from '../components/Equipment/EquipmentState';
import SampleChangerMaintenance from '../components/Equipment/SampleChangerMaintenance';
import GenericEquipmentControl from '../components/Equipment/GenericEquipmentControl';

class EquipmentContainer extends React.Component {
  render() {
    return (
      <Container fluid className='mt-3'>
        <Row className="d-flex">
          <Col sm={12}>
              <Row className="d-flex">
              <Col sm={12} className='mt-1 mb-3'>
                <EquipmentState
                  state={this.props.sampleChangerState}
                  equipmentName='Samplechanger'
                />
              </Col>
            </Row>
            <Row className="row">
              <Col sm={6}>
                <SampleChanger
                  state={this.props.sampleChangerState}
                  loadedSample={this.props.loadedSample}
                  select={this.props.select}
                  load={this.props.loadSample}
                  unload={this.props.unloadSample}
                  abort={this.props.abort}
                  scan={this.props.scan}
                  contents={this.props.contents}
                  refresh={this.props.refresh}
                />
              </Col>
              <Col sm={6}>
                <SampleChangerMaintenance
                  commands={this.props.commands}
                  global_state={this.props.global_state}
                  commands_state={this.props.commands_state}
                  message={this.props.message}
                  send_command={this.props.sendCommand}
                />
              </Col>
            </Row>
            <Row>
              <Col sm={12}>
                { Object.entries(this.props.beamline.attributes).map(([key, value]) => {
                    const obj = this.props.beamline.attributes[key];
                    if (Object.values(obj.attributes).length > 0) {
                      return (<GenericEquipmentControl
                        equipment={obj}
                        executeCommand={this.props.executeCommand}
                      />)
                    } 
                      return null;
                    
                  })
                }
              </Col>
          </Row>
          </Col>
        </Row>
      </Container>
    );
  }
}

function mapStateToProps(state) {
  return {
    contents: state.sampleChanger.contents,
    sampleChangerState: state.sampleChanger.state,
    loadedSample: state.sampleChanger.loadedSample,
    commands: state.sampleChangerMaintenance.commands,
    commands_state: state.sampleChangerMaintenance.commands_state,
    global_state: state.sampleChangerMaintenance.global_state,
    message: state.sampleChangerMaintenance.message,
    beamline: state.beamline
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
    sendCommand: (cmd, args) => dispatch(sendCommand(cmd, args)),
    executeCommand: bindActionCreators(executeCommand, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EquipmentContainer);
