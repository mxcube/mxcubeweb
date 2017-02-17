import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { startAction, stopAction, showActionOutput, hideActionOutput } from '../actions/beamlineActions';
import { Row, Col, Modal, MenuItem, DropdownButton, Button } from 'react-bootstrap';
import BeamlineActionControl from '../components/BeamlineActions/BeamlineActionControl';
import { RUNNING } from '../constants';

class BeamlineActionsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.startAction = this.startAction.bind(this);
    this.stopAction = this.stopAction.bind(this);
    this.showOutput = this.showOutput.bind(this);
    this.hideOutput = this.hideOutput.bind(this);
  }

  startAction(cmdName) {
    this.props.startAction(cmdName, []);
  }

  stopAction(cmdName) {
    this.props.stopAction(cmdName);
  }

  showOutput(cmdName) {
    this.props.showOutput(cmdName);
  }

  hideOutput() {
    this.props.hideOutput(this.props.currentAction.name);
  }

  render() {
    return (
      <Row>
        <Col xs={12}>
            <DropdownButton title={'Beamline Actions'}>
             {this.props.actionsList.map((cmd, i) => {
               const cmdName = cmd.name;
               const cmdUsername = cmd.username;
               const cmdState = cmd.state;
               let disabled = false;
               if ((this.props.currentAction.state === RUNNING) &&
                  (this.props.currentAction.name !== cmdName)) {
                 disabled = true;
               }
    
               return (<MenuItem eventKey={i}>{cmdUsername}
                  <BeamlineActionControl cmdName={cmdName}
                                         start={this.startAction}
                                         stop={this.stopAction}
                                         showOutput={this.showOutput}
                                         state={cmdState}
                                         disabled={disabled}
                  />
               </MenuItem>);
             })}
            </DropdownButton>
        </Col>
        <Modal id='beamlineActionOutput' show={!!this.props.currentAction.show} onHide={this.hideOutput}>
        <Modal.Header>
          <Modal.Title>
            {this.props.currentAction.username}
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.props.currentAction.messages.map(message => {
              return <p>{message.message}</p>
            })}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.hideOutput}> Close window </Button>
            { this.props.currentAction.state === RUNNING ?
              <Button bsStyle='danger' onClick={ () => { this.stopAction(this.props.currentAction.name) } }> Abort </Button>
              : <Button bsStyle='primary' onClick={ () => { this.startAction(this.props.currentAction.name) } }> Run </Button>
            }
          </Modal.Footer>
        </Modal>
      </Row>
     );
  }
}

function mapStateToProps(state) {
  return {
    currentAction: state.beamline.currentBeamlineAction
  };
}

function mapDispatchToProps(dispatch) {
  return {
    startAction: bindActionCreators(startAction, dispatch),
    stopAction: bindActionCreators(stopAction, dispatch),
    showOutput: bindActionCreators(showActionOutput, dispatch),
    hideOutput: bindActionCreators(hideActionOutput, dispatch)
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BeamlineActionsContainer);


