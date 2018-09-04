import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { startAction,
         stopAction,
         showActionOutput,
         hideActionOutput,
         setArgumentValue } from '../actions/beamlineActions';
import { Row,
         Col,
         Modal,
         MenuItem,
         DropdownButton,
         Button,
         Well,
         FormControl } from 'react-bootstrap';
import BeamlineActionControl from '../components/BeamlineActions/BeamlineActionControl';
import Plot1D from '../components/Plot1D';
import { RUNNING } from '../constants';

class BeamlineActionsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.plotIdByAction = {};

    this.startAction = this.startAction.bind(this);
    this.stopAction = this.stopAction.bind(this);
    this.showOutput = this.showOutput.bind(this);
    this.hideOutput = this.hideOutput.bind(this);
    this.newPlotDisplayed = this.newPlotDisplayed.bind(this);
  }

  startAction(cmdName, showOutput = true) {
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

    this.plotIdByAction[this.props.currentAction.name] = null;
    this.props.startAction(cmdName, parameters, showOutput);
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

  newPlotDisplayed(plotId) {
    this.plotIdByAction[this.props.currentAction.name] = plotId;
  }

  render() {
    const currentActionRunning = this.props.currentAction.state === RUNNING;
    const currentActionName = this.props.currentAction.name;

    return (
      <Row>
        <Col xs={12}>
            <DropdownButton title={'Beamline Actions'} id="beamline-actions-dropdown">
             {this.props.actionsList.map((cmd, i) => {
               const cmdName = cmd.name;
               const cmdUsername = cmd.username;
               const cmdState = cmd.state;
               let disabled = false;
               if (currentActionRunning && (currentActionName !== cmdName)) {
                 disabled = true;
               }

               return (
                 <MenuItem eventKey={i} key={i}>
                   <span><b>{cmdUsername}</b></span>
                   <BeamlineActionControl cmdName={cmdName}
                     start={this.startAction}
                     stop={this.stopAction}
                     showOutput={this.showOutput}
                     state={cmdState}
                     disabled={disabled}
                     arguments={cmd.arguments}
                     type={cmd.type}
                     data={cmd.data}
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
            <Modal.Body style={{ height: '500px', overflowY: 'auto' }}>
              { this.props.currentAction.arguments.map((arg, i) =>
                <Row>
                  <Col xs={2} component="ControlLabel">{arg.name}</Col>
                  <Col xs={2}>
                    <FormControl label={arg.name}
                      type="text"
                      value={arg.value}
                      disabled={currentActionRunning}
                      onChange={(e) => {
                        this.props.setArgumentValue(currentActionName,
                                                    i,
                                                    e.target.value);
                      }}
                    />
                  </Col>
                </Row>)
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
             <Plot1D displayedPlotCallback={this.newPlotDisplayed}
               plotId={this.plotIdByAction[currentActionName]} autoNext={currentActionRunning}
             />
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

