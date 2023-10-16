import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import JSForm from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import styles from './BeamlineActions.module.css';

export default function AnnotatedBeamlineActionForm(props) {
  const {
    actionId,
    actionSchema,
    isActionRunning,
    handleStopAction,
    handleStartAction,
  } = props;

  return (
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
  );
}
