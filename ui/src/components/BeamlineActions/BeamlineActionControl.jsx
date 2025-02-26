import React from 'react';
import { Button, ButtonGroup, ButtonToolbar } from 'react-bootstrap';
import { BiLinkExternal } from 'react-icons/bi';
import {
  RUNNING,
  twoStateActuatorIsActive,
  TWO_STATE_ACTUATOR,
} from '../../constants';
import { showActionOutput } from '../../actions/beamlineActions';
import { useDispatch } from 'react-redux';

export default function BeamlineActionControl(props) {
  const {
    actionId,
    actionArguments,
    handleStartAction,
    handleStopAction,
    state,
    disabled,
    type,
    data,
  } = props;
  let variant = state === RUNNING ? 'danger' : 'primary';
  let label = state === RUNNING ? 'Stop' : 'Run';
  const showOutput = type !== TWO_STATE_ACTUATOR;
  const dispatch = useDispatch();

  if (type === 'INOUT') {
    label = String(data).toUpperCase();
    variant = twoStateActuatorIsActive(data) ? 'success' : 'danger';
  }

  return (
    <ButtonToolbar>
      <ButtonGroup className="d-flex flex-row" aria-label="First group">
        {actionArguments.length === 0 ? (
          <Button
            size="sm"
            className="me-1"
            variant={variant}
            disabled={disabled}
            onClick={
              state !== RUNNING
                ? () => handleStartAction(actionId, showOutput)
                : () => handleStopAction(actionId)
            }
          >
            {label}
          </Button>
        ) : (
          ''
        )}
        {showOutput ? (
          <Button
            variant="outline-secondary"
            disabled={disabled}
            size="sm"
            onClick={() => dispatch(showActionOutput(actionId))}
          >
            <BiLinkExternal />
          </Button>
        ) : (
          ''
        )}
      </ButtonGroup>
    </ButtonToolbar>
  );
}
