import { Button, ButtonGroup, ButtonToolbar } from 'react-bootstrap';
import { BiLinkExternal } from 'react-icons/bi';
import {
  RUNNING,
  twoStateActuatorIsActive,
  TWO_STATE_ACTUATOR,
} from '../../constants';
import {
  showActionOutput,
  stopBeamlineAction,
} from '../../actions/beamlineActions';
import { useDispatch, useSelector } from 'react-redux';

export default function BeamlineActionControl(props) {
  const {
    actionId,
    actionArguments,
    state: objState,
    type,
    data,
    handleStartAction,
  } = props;

  let variant = objState === RUNNING ? 'danger' : 'primary';
  let label = objState === RUNNING ? 'Stop' : 'Run';
  const showOutput = type !== TWO_STATE_ACTUATOR;
  const dispatch = useDispatch();

  const currentActionName = useSelector(
    (state) => state.beamline.currentBeamlineAction.name,
  );
  const currentActionState = useSelector(
    (state) => state.beamline.currentBeamlineAction.state,
  );

  const disabled =
    currentActionName !== actionId && currentActionState === RUNNING;

  if (type === 'INOUT') {
    label = String(data).toUpperCase();
    variant = twoStateActuatorIsActive(data) ? 'success' : 'danger';
  }

  return (
    <ButtonToolbar>
      <ButtonGroup className="d-flex flex-row" aria-label="First group">
        {actionArguments.length === 0 && (
          <Button
            size="sm"
            className="me-1"
            variant={variant}
            disabled={disabled}
            onClick={
              objState !== RUNNING
                ? () => handleStartAction(actionId, {}, showOutput)
                : () => dispatch(stopBeamlineAction(actionId))
            }
          >
            {label}
          </Button>
        )}
        {showOutput && (
          <Button
            variant="outline-secondary"
            disabled={disabled}
            size="sm"
            onClick={() => dispatch(showActionOutput(actionId))}
          >
            <BiLinkExternal />
          </Button>
        )}
      </ButtonGroup>
    </ButtonToolbar>
  );
}
