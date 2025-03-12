import React, { Fragment } from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import {
  setArgumentValue,
  stopBeamlineAction,
} from '../../actions/beamlineActions';
import { RUNNING } from '../../constants';

export default function BeamlineActionForm(props) {
  const { handleStartAction } = props;
  const dispatch = useDispatch();
  const currentAction = useSelector(
    (state) => state.beamline.currentBeamlineAction,
  );

  const isActionRunning = currentAction.state === RUNNING;
  const actionId = currentAction.name;

  return (
    <Row>
      {currentAction.arguments.map((arg, i) => (
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
                dispatch(setArgumentValue(actionId, i, e.target.value));
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
              dispatch(stopBeamlineAction(actionId));
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
