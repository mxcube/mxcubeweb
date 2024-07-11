/* eslint-disable react/no-array-index-key */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  startBeamlineAction,
  stopBeamlineAction,
  showActionOutput,
  hideActionOutput,
  setArgumentValue,
} from '../actions/beamlineActions';
import { Dropdown } from 'react-bootstrap';
import BeamlineActionControl from '../components/BeamlineActions/BeamlineActionControl';
import BeamlineActionDialog from '../components/BeamlineActions/BeamlineActionDialog';
import { RUNNING } from '../constants';

class BeamlineActionsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.plotIdByAction = {};

    this.startAction = this.startAction.bind(this);
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

    if (this.props.actionsList.length === 0) {
      return null;
    }

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
            size="sm"
            style={{ width: '150px' }}
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
                  className="d-flex justify-content-between align-items-start"
                  key={i}
                >
                  <div className="mx-2">
                    <div className="fw-bold">{cmdUsername}</div>
                  </div>
                  <BeamlineActionControl
                    actionId={cmdName}
                    actionArguments={cmd.arguments}
                    handleStartAction={
                      cmd.argument_type === 'List'
                        ? this.startAction
                        : () => this.props.startAction(cmdName, {})
                    }
                    handleStopAction={this.props.stopAction}
                    handleShowOutput={this.props.showOutput}
                    state={cmdState}
                    disabled={disabled}
                    type={cmd.type}
                    data={cmd.data}
                  />
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
        <BeamlineActionDialog
          isDialogVisble={this.props.currentAction.show}
          handleOnHide={this.hideOutput}
          defaultPosition={defaultDialogPosition}
          actionName={this.props.currentAction.username}
          actionId={currentActionName}
          actionSchema={this.props.currentAction.schema}
          actionArguments={this.props.currentAction.arguments}
          actionType={this.props.currentAction.argument_type}
          isActionRunning={currentActionRunning}
          actionMessages={this.props.currentAction.messages}
          handleSetActionArgument={this.props.setArgumentValue}
          handleStopAction={this.props.stopAction}
          handleStartAction={this.startAction}
          handleStartAnnotatedAction={this.props.startAction}
          handleOnPlotDisplay={this.newPlotDisplayed}
          plotId={this.plotIdByAction[currentActionName]}
        />
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
    startAction: bindActionCreators(startBeamlineAction, dispatch),
    stopAction: bindActionCreators(stopBeamlineAction, dispatch),
    showOutput: bindActionCreators(showActionOutput, dispatch),
    hideOutput: bindActionCreators(hideActionOutput, dispatch),
    setArgumentValue: bindActionCreators(setArgumentValue, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BeamlineActionsContainer);
