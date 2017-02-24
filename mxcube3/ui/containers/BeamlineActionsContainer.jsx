import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { startAction,
         stopAction,
         showActionOutput,
         hideActionOutput,
         setArgumentValue } from '../actions/beamlineActions';
import { Row, Col, Modal, MenuItem, DropdownButton, Button, Well, Input } from 'react-bootstrap';
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
    const parameters = [];

    this.props.actionsList.some((cmd) => {
      if (cmd.name === cmdName) {
        cmd.arguments.forEach((arg) => {
          if (arg.type === 'float') {
            parameters.push(parseFloat(arg.value));
          } else {
            parameters.push(arg.value);
          }
        });
        return true;
      }
      return false;
    });

    this.props.startAction(cmdName, parameters);
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
    const currentActionRunning = this.props.currentAction.state === RUNNING;
    const currentActionName = this.props.currentAction.name;

    return (
      <Row>
        <Col xs={12}>
            <DropdownButton title={'Beamline Actions'}>
             {this.props.actionsList.map((cmd, i) => {
               const cmdName = cmd.name;
               const cmdUsername = cmd.username;
               const cmdState = cmd.state;
               let disabled = false;
               if (currentActionRunning && (currentActionName !== cmdName)) {
                 disabled = true;
               }

               return (
                  <MenuItem eventKey={i}>{cmdUsername}
                  <BeamlineActionControl cmdName={cmdName}
                    start={this.startAction}
                    stop={this.stopAction}
                    showOutput={this.showOutput}
                    state={cmdState}
                    disabled={disabled}
                    arguments={cmd.arguments}
                  />
               </MenuItem>);
             })}
            </DropdownButton>
        </Col>
        <Modal id="beamlineActionOutput"
          show={!!this.props.currentAction.show}
          onHide={this.hideOutput}
        >
          <Modal.Header>
            <Modal.Title>
              {this.props.currentAction.username}
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              { this.props.currentAction.arguments.map((arg, i) =>
                <Input label={arg.name}
                  type="text"
                  value={arg.value}
                  disabled={currentActionRunning}
                  onChange={(e) => {
                    this.props.setArgumentValue(currentActionName, i, e.target.value);
                  }}
                />)
              }
              { currentActionRunning ?
                <Button bsStyle="danger"
                  onClick={ () => { this.stopAction(currentActionName); } }
                >
                  Abort
                </Button> : <Button disabled={currentActionRunning}
                  bsStyle="primary"
                  onClick={ () => { this.startAction(currentActionName); } }
                >
                  Run
                </Button> }
             <hr></hr>
             { this.props.currentAction.messages.length > 0 ? (<Well>
               {this.props.currentAction.messages.map(message => <p>{message.message}</p>)}
             </Well>) : '' }
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.hideOutput}> Close window </Button>
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
    hideOutput: bindActionCreators(hideActionOutput, dispatch),
    setArgumentValue: bindActionCreators(setArgumentValue, dispatch)
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BeamlineActionsContainer);

