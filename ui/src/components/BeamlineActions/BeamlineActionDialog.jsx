import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideActionOutput } from '../../actions/beamlineActions';
import { Row, Col, Modal, Button, Card } from 'react-bootstrap';
import Plot1D from '../Plot1D';
import { DraggableModal } from '../DraggableModal';
import AnnotatedBeamlineActionForm from './AnnotatedBeamlineActionForm';
import BeamlineActionForm from './BeamlineActionForm';
import { RUNNING } from '../../constants';

const DEFAULT_DIALOG_POSITION = { x: -100, y: 100 };

export default function BeamlineActionDialog(props) {
  const { handleStartAction, plotId, handleOnPlotDisplay } = props;
  const dispatch = useDispatch();
  const currentAction = useSelector(
    (state) => state.beamline.currentBeamlineAction,
  );

  const handleOnHide = () => {
    dispatch(hideActionOutput(currentAction.name));
  };

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
            <Plot1D
              displayedPlotCallback={handleOnPlotDisplay}
              plotId={plotId}
              autoNext={isActionRunning}
            />
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
