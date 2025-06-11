import JSForm from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { Button, Col, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { stopBeamlineAction } from '../../actions/beamlineActions';
import { RUNNING } from '../../constants';
import styles from './BeamlineActions.module.css';

export default function AnnotatedBeamlineActionForm(props) {
  const { handleStartAction } = props;
  const dispatch = useDispatch();
  const currentAction = useSelector(
    (state) => state.beamline.currentBeamlineAction,
  );

  const isActionRunning = currentAction.state === RUNNING;
  const actionId = currentAction.name;

  return (
    <Row className="py-2">
      <Col className="col-md-4">
        <div className={styles.formContainer}>
          <JSForm
            liveValidate
            validator={validator}
            schema={JSON.parse(currentAction.schema)}
            onSubmit={({ formData }) => {
              handleStartAction(actionId, formData);
            }}
          >
            {isActionRunning ? (
              <Button
                className={styles.submitButton}
                variant="danger"
                onClick={() => {
                  dispatch(stopBeamlineAction('beamline_actions'));
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
