import React from 'react';
import { Row, Col, Modal, Button, Card } from 'react-bootstrap';
import Plot1D from '../Plot1D';
import { DraggableModal } from '../DraggableModal';
import AnnotatedBeamlineActionForm from './AnnotatedBeamlineActionForm';
import BeamlineActionForm from './BeamlineActionForm';

export default function BeamlineActionDialog(props) {
  const {
    isDialogVisble,
    handleOnHide,
    defaultPosition,
    actionName,
    actionId,
    actionType,
    actionArguments,
    actionSchema,
    isActionRunning,
    actionMessages,
    handleStopAction,
    handleStartAction,
    handleStartAnnotatedAction,
    handleOnPlotDisplay,
    handleSetActionArgument,
    plotId,
  } = props;

  return (
    <DraggableModal
      id="beamlineActionOutput"
      show={isDialogVisble}
      onHide={handleOnHide}
      defaultpos={defaultPosition}
    >
      <Modal.Header>
        <Modal.Title>{actionName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {actionType === 'List' && (
          <BeamlineActionForm
            actionId={actionId}
            isActionRunning={isActionRunning}
            actionArguments={actionArguments}
            handleStopAction={handleStopAction}
            handleStartAction={handleStartAction}
            handleSetActionArgument={handleSetActionArgument}
          />
        )}
        {actionType === 'JSONSchema' && (
          <AnnotatedBeamlineActionForm
            actionId={actionId}
            actionSchema={actionSchema}
            isActionRunning={isActionRunning}
            handleStopAction={handleStopAction}
            handleStartAction={handleStartAnnotatedAction}
          />
        )}
        <Row className="py-2">
          <Col>
            <Plot1D
              displayedPlotCallback={handleOnPlotDisplay}
              plotId={plotId}
              autoNext={isActionRunning}
            />
            {actionMessages.length > 0 && (
              <Card>
                {actionMessages.map((message) => (
                  <p key={message}>{message.message}</p>
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
