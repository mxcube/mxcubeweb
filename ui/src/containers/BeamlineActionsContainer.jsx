import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  startAction,
  stopAction,
  showActionOutput,
  hideActionOutput,
  setArgumentValue,
} from '../actions/beamlineActions';
import { Row, Col, Modal, Dropdown, Button, Form, Card } from 'react-bootstrap';
import BeamlineActionControl from '../components/BeamlineActions/BeamlineActionControl';
import Plot1D from '../components/Plot1D';
import { RUNNING } from '../constants';

import { DraggableModal } from '../components/DraggableModal';

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
            parameters.push(Number.parseFloat(arg.value));
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

    const defaultDialogPosition = { x: -100, y: 100 };

    return (
      <>
        <Dropdown
          title="Beamline Actions"
          id="beamline-actions-dropdown"
          variant="outline-secondary"
          autoClose="outside"
        >
          <Dropdown.Toggle
            variant="outline-secondary"
            id="beamline-actions-dropdown"
          >
            Beamline Actions
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {this.props.actionsList.map((cmd, i) => {
              const cmdName = cmd.name;
              const cmdUsername = cmd.username;
              const cmdState = cmd.state;
              let disabled = false;
              if (currentActionRunning && currentActionName !== cmdName) {
                disabled = true;
              }

              return (
                <Dropdown.Item
                  style={{ width: '250px' }}
                  className="d-flex justify-content-between align-items-start"
                  key={i}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{cmdUsername}</div>
                  </div>
                  <BeamlineActionControl
                    cmdName={cmdName}
                    start={this.startAction}
                    stop={this.stopAction}
                    showOutput={this.showOutput}
                    state={cmdState}
                    disabled={disabled}
                    arguments={cmd.arguments}
                    type={cmd.type}
                    data={cmd.data}
                  />
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
        <DraggableModal
          id="beamlineActionOutput"
          show={!!this.props.currentAction.show}
          onHide={this.hideOutput}
          defaultpos={defaultDialogPosition}
        >
          <Modal.Header>
            <Modal.Title>{this.props.currentAction.username}</Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="d-flex"
            style={{ height: '500px', overflowY: 'auto' }}
          >
            <Row>
              {this.props.currentAction.arguments.map((arg, i) => (
                <>
                  <Col
                    className="mt-2"
                    xs={3}
                    style={{ whiteSpace: 'nowrap' }}
                    component={Form.Label}
                  >
                    {arg.name}
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      label={arg.name}
                      type="text"
                      value={arg.value}
                      disabled={currentActionRunning}
                      onChange={(e) => {
                        this.props.setArgumentValue(
                          currentActionName,
                          i,
                          e.target.value
                        );
                      }}
                    />
                  </Col>
                </>
              ))}
              <Col>
                {currentActionRunning ? (
                  <Button
                    variant="danger"
                    onClick={() => {
                      this.stopAction(currentActionName);
                    }}
                  >
                    Abort
                  </Button>
                ) : (
                  <Button
                    disabled={currentActionRunning}
                    variant="primary"
                    onClick={() => {
                      this.startAction(currentActionName);
                    }}
                  >
                    Run
                  </Button>
                )}
              </Col>
            </Row>
            <hr />
            <Plot1D
              displayedPlotCallback={this.newPlotDisplayed}
              plotId={this.plotIdByAction[currentActionName]}
              autoNext={currentActionRunning}
            />
            {this.props.currentAction.messages.length > 0 ? (
              <Card>
                {this.props.currentAction.messages.map((message) => (
                  <p>{message.message}</p>
                ))}
              </Card>
            ) : (
              ''
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={this.hideOutput}
              disabled={currentActionRunning}
            >
              Close window
            </Button>
          </Modal.Footer>
        </DraggableModal>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentAction: state.beamline.currentBeamlineAction,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    startAction: bindActionCreators(startAction, dispatch),
    stopAction: bindActionCreators(stopAction, dispatch),
    showOutput: bindActionCreators(showActionOutput, dispatch),
    hideOutput: bindActionCreators(hideActionOutput, dispatch),
    setArgumentValue: bindActionCreators(setArgumentValue, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BeamlineActionsContainer);
