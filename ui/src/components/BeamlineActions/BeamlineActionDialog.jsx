import React from 'react';
import { Row, Col, Modal, Button, Form, Card } from 'react-bootstrap';
import Plot1D from '../Plot1D';
import { DraggableModal } from '../DraggableModal';

export default function BeamlineActionDialog(props) {
  const {
    isDialogVisble,
    handleOnHide,
    defaultPosition,
    actionName,
    actionId,
    actionArguments,
    isActionRunning,
    actionMessages,
    handleSetActionArgument,
    handleStopAction,
    handleStartAction,
    handleOnPlotDisplay,
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
      <Modal.Body
        className="d-flex"
        style={{ height: '500px', overflowY: 'auto' }}
      >
        <Row>
          {actionArguments.map((arg, i) => (
            <Fragment key={arg.name}>
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
                  disabled={isActionRunning}
                  onChange={(e) => {
                    handleSetActionArgument(actionId, i, e.target.value);
                  }}
                />
              </Col>
            </Fragment>
          ))}
          <Col>
            {isActionRunning ? (
              <Button
                variant="danger"
                onClick={() => {
                  handleStopAction(actionId);
                }}
              >
                Abort
              </Button>
            ) : (
              <Button
                disabled={isActionRunning}
                variant="primary"
                onClick={() => {
                  handleStartAction(actionId);
                }}
              >
                Run
              </Button>
            )}
          </Col>
        </Row>
        <hr />
        <Plot1D
          displayedPlotCallback={handleOnPlotDisplay}
          plotId={plotId}
          autoNext={isActionRunning}
        />
        {actionMessages.length > 0 ? (
          <Card>
            {actionMessages.map((message) => (
              // eslint-disable-next-line react/jsx-key
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
          onClick={handleOnHide}
          disabled={isActionRunning}
        >
          Close window
        </Button>
      </Modal.Footer>
    </DraggableModal>
  );
}
