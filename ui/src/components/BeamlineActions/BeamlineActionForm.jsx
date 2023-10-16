import React, { Fragment } from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';

export default function BeamlineActionForm(props) {
  const {
    actionId,
    isActionRunning,
    actionArguments,
    handleStopAction,
    handleStartAction,
    handleSetActionArgument,
  } = props;

  return (
    <Row>
      {actionArguments.map((arg, i) => (
        <Fragment key={arg.name}>
          <Col className="mt-2" xs={1} style={{ whiteSpace: 'nowrap' }}>
            {arg.name}
          </Col>
          <Col xs={1}>
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
  );
}
