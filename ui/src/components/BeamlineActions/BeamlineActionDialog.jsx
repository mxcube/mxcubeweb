import PropTypes from 'prop-types';
import { Button, Card, Col, Modal, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { hideActionOutput } from '../../actions/beamlineActions';
import { RUNNING } from '../../constants';
import { DraggableModal } from '../DraggableModal';
import AnnotatedBeamlineActionForm from './AnnotatedBeamlineActionForm';
import BeamlineActionForm from './BeamlineActionForm';

const DEFAULT_DIALOG_POSITION = { x: -100, y: 100 };

/**
 * BeamlineActionDialog displays a draggable modal for the current beamline action.
 *
 * @param {Object} props
 * @param {(cmdName: string, params?: Object, showOutput?: boolean) => void} props.handleStartAction
 * @returns {JSX.Element}
 */
export default function BeamlineActionDialog({ handleStartAction }) {
  const dispatch = useDispatch();
  const currentAction = useSelector(
    (state) => state.beamline.currentBeamlineAction,
  );

  function handleOnHide() {
    dispatch(hideActionOutput(currentAction.name));
  }

  const isActionRunning = currentAction.state === RUNNING;

  return (
    <DraggableModal
      id="beamlineActionOutput"
      show={currentAction.show}
      onHide={handleOnHide}
      defaultpos={DEFAULT_DIALOG_POSITION}
    >
      <Modal.Header>
        <Modal.Title>{currentAction.username}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentAction.argument_type === 'List' && (
          <BeamlineActionForm handleStartAction={handleStartAction} />
        )}
        {currentAction.argument_type === 'JSONSchema' && (
          <AnnotatedBeamlineActionForm handleStartAction={handleStartAction} />
        )}
        <Row className="py-2">
          <Col>
            {currentAction.messages.length > 0 && (
              <Card>
                {currentAction.messages.map((message) => (
                  <p key={message.timestamp}>{message.message}</p>
                ))}
              </Card>
            )}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={handleOnHide}
          disabled={isActionRunning}
        >
          Close window
        </Button>
      </Modal.Footer>
    </DraggableModal>
  );
}

BeamlineActionDialog.propTypes = {
  handleStartAction: PropTypes.func.isRequired,
};
