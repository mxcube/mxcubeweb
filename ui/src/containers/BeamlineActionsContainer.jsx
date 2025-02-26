import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  startBeamlineAction,
  stopBeamlineAction,
  hideActionOutput,
} from '../actions/beamlineActions';
import { Dropdown } from 'react-bootstrap';
import BeamlineActionControl from '../components/BeamlineActions/BeamlineActionControl';
import BeamlineActionDialog from '../components/BeamlineActions/BeamlineActionDialog';
import { RUNNING } from '../constants';

function BeamlineActionsContainer(props) {
  const { actionsList } = props;

  const dispatch = useDispatch();
  const currentAction = useSelector(
    (state) => state.beamline.currentBeamlineAction,
  );

  const [plotIdByAction, setPlotIdByAction] = useState({});

  const startAction = useCallback(
    (cmdName, showOutput = true) => {
      const cmd = actionsList.find((cmd) => cmd.name === cmdName);
      if (!cmd) {
        return;
      }

      const parameters = cmd.arguments.map((arg) =>
        arg.type === 'float' ? Number.parseFloat(arg.value) : arg.value,
      );

      setPlotIdByAction((prev) => ({ ...prev, [currentAction.name]: null }));
      dispatch(startBeamlineAction(cmdName, parameters, showOutput));
    },
    [actionsList, currentAction.name, dispatch],
  );

  const hideOutput = useCallback(() => {
    dispatch(hideActionOutput(currentAction.name));
  }, [currentAction.name, dispatch]);

  const newPlotDisplayed = useCallback(
    (plotId) => {
      setPlotIdByAction((prev) => ({ ...prev, [currentAction.name]: plotId }));
    },
    [currentAction.name],
  );

  if (actionsList.length === 0) {
    return null;
  }

  const currentActionRunning = currentAction.state === RUNNING;
  const currentActionName = currentAction.name;
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
          size="sm"
          style={{ width: '150px' }}
        >
          Beamline Actions
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {actionsList.map((cmd, i) => {
            const cmdName = cmd.name;
            const disabled =
              currentActionRunning && currentActionName !== cmdName;

            return (
              <Dropdown.Item
                className="d-flex justify-content-between align-items-start"
                key={cmdName}
              >
                <div className="mx-2">
                  <div className="fw-bold">{cmd.username}</div>
                </div>
                <BeamlineActionControl
                  actionId={cmdName}
                  actionArguments={cmd.arguments}
                  handleStartAction={
                    cmd.argument_type === 'List'
                      ? startAction
                      : (actionId, showOutput) =>
                          dispatch(
                            startBeamlineAction(actionId, {}, showOutput),
                          )
                  }
                  handleStopAction={(actionId) =>
                    dispatch(stopBeamlineAction(actionId))
                  }
                  state={cmd.state}
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
        isDialogVisble={currentAction.show}
        handleOnHide={hideOutput}
        defaultPosition={defaultDialogPosition}
        actionName={currentAction.username}
        actionId={currentActionName}
        actionSchema={currentAction.schema}
        actionArguments={currentAction.arguments}
        actionType={currentAction.argument_type}
        isActionRunning={currentActionRunning}
        actionMessages={currentAction.messages}
        handleStopAction={(actionId) => dispatch(stopBeamlineAction(actionId))}
        handleStartAction={startAction}
        handleStartAnnotatedAction={(cmdName, params, showOutput) =>
          dispatch(startBeamlineAction(cmdName, params, showOutput))
        }
        handleOnPlotDisplay={newPlotDisplayed}
        plotId={plotIdByAction[currentActionName]}
      />
    </>
  );
}

export default BeamlineActionsContainer;
