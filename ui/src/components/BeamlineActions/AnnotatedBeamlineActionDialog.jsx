import React from 'react';
import { Row, Col, Modal, Button, Card } from 'react-bootstrap';
import Plot1D from '../Plot1D';
import { DraggableModal } from '../DraggableModal';
import JSForm from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import styles from './BeamlineActions.module.css';

export default function AnnotatedBeamlineActionDialog(props) {
  const {
    isDialogVisble,
    handleOnHide,
    defaultPosition,
    actionName,
    actionId,
    actionSchema,
    isActionRunning,
    actionMessages,
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
      <Modal.Body>
        <Row className="py-2">
          <Col className="col-md-4">
            <div className={styles.formContainer}>
              <JSForm
                liveValidate
                validator={validator}
                schema={JSON.parse(actionSchema)}
                onSubmit={({ formData }) => {
                  handleStartAction(actionId, formData);
                }}
              >
                {isActionRunning ? (
                  <Button
                    className={styles.submitButton}
                    variant="danger"
                    onClick={() => {
                      handleStopAction(actionId);
                    }}
                  >
                    Abort
                  </Button>
                ) : (
                  <Button
                    className={styles.submitButton}
                    disabled={isActionRunning}
                    variant="primary"
                    type="submit"
                  >
                    Run
                  </Button>
                )}
              </JSForm>
            </div>
          </Col>
          <Row className="py-2" />
        </Row>
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
