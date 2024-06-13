import React from 'react';
import { Button, ButtonGroup, ButtonToolbar } from 'react-bootstrap';
import { BiLinkExternal } from 'react-icons/bi';
import {
  RUNNING,
  twoStateActuatorIsActive,
  TWO_STATE_ACTUATOR,
} from '../../constants';

export default function BeamlineActionControl(props) {
  let variant = props.state === RUNNING ? 'danger' : 'primary';
  let label = props.state === RUNNING ? 'Stop' : 'Run';
  const showOutput = props.type !== TWO_STATE_ACTUATOR;

  if (props.type === 'INOUT') {
    label = String(props.data).toUpperCase();
    variant = twoStateActuatorIsActive(props.data) ? 'success' : 'danger';
  }

  return (
    <ButtonToolbar>
      <ButtonGroup className="d-flex flex-row" aria-label="First group">
        {props.actionArguments.length === 0 ? (
          <Button
            size="sm"
            className="me-1"
            variant={variant}
            disabled={props.disabled}
            onClick={
              props.state !== RUNNING
                ? () => props.handleStartAction(props.actionId, showOutput)
                : () => props.handleStopAction(props.actionId)
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
            disabled={props.disabled}
            size="sm"
            onClick={() => props.handleShowOutput(props.actionId)}
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
