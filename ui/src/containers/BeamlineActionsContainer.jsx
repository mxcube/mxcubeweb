import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown } from 'react-bootstrap';
import BeamlineActionControl from '../components/BeamlineActions/BeamlineActionControl';
import BeamlineActionDialog from '../components/BeamlineActions/BeamlineActionDialog';
import { startBeamlineAction } from '../actions/beamlineActions';

function BeamlineActionsContainer() {
  const dispatch = useDispatch();
  const actionsList = useSelector(
    (state) => state.beamline.beamlineActionsList,
  );
  const currentActionName = useSelector(
    (state) => state.beamline.currentBeamlineAction.name,
  );

  const [plotIdByAction, setPlotIdByAction] = useState({});

  function startAction(cmdName, params = {}, showOutput = true) {
    const cmd = actionsList.find((action) => action.name === cmdName);
    if (!cmd) {
      return;
    }

    setPlotIdByAction((prev) => ({ ...prev, [currentActionName]: null }));

    if (cmd.argument_type === 'List') {
      const parameters = cmd.arguments.map((arg) =>
        arg.type === 'float' ? Number.parseFloat(arg.value) : arg.value,
      );
      dispatch(startBeamlineAction(cmdName, parameters, showOutput));
      return;
    }

    dispatch(startBeamlineAction(cmdName, params, showOutput));
  }

  const newPlotDisplayed = useCallback(
    (plotId) => {
      setPlotIdByAction((prev) => ({ ...prev, [currentActionName]: plotId }));
    },
    [currentActionName],
  );

  if (actionsList.length === 0) {
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
          {actionsList.map((cmd, i) => {
            const cmdName = cmd.name;

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
                  state={cmd.state}
                  type={cmd.type}
                  data={cmd.data}
                  handleStartAction={startAction}
                />
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
      <BeamlineActionDialog
        handleStartAction={startAction}
        plotId={plotIdByAction[currentActionName]}
        handleOnPlotDisplay={newPlotDisplayed}
      />
    </>
  );
}

export default BeamlineActionsContainer;
