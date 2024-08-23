import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { respondToControlRequest } from '../../actions/remoteAccess';
import { useForm } from 'react-hook-form';

function PassControlDialog() {
  const dispatch = useDispatch();

  const inControl = useSelector((state) => state.login.user.inControl);
  const requestingObs = useSelector((state) =>
    state.remoteAccess.observers.find((o) => o.requestsControl),
  );

  const showModal = inControl && !!requestingObs;

  const {
    register,
    formState,
    handleSubmit: makeOnSubmit,
    setError,
    reset,
  } = useForm({ defaultValues: { message: 'Here you go!' } });

  const { isDirty, isSubmitted, errors } = formState;

  async function handleSubmit(data, evt) {
    const isAllow = evt.nativeEvent.submitter.name === 'allow';

    if (!isAllow && !isDirty) {
      setError(
        'message',
        { message: "Please explain why you're denying this request" },
        { shouldFocus: true },
      );
      return;
    }

    await dispatch(respondToControlRequest(isAllow, data.message));
  }

  useEffect(() => {
    if (!showModal) {
      reset(); // make sure form is properly reset if requester cancels
    }
  }, [showModal, reset]);

  return (
    <Modal
      show={showModal}
      backdrop="static"
      style={{ zIndex: 10_001 }}
      data-default-styles
    >
      <Form onSubmit={makeOnSubmit(handleSubmit)}>
        <Modal.Header>
          <Modal.Title>
            {requestingObs?.nickname} is asking for control
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {requestingObs?.requestsControlMsg && (
            <Alert>{requestingObs.requestsControlMsg}</Alert>
          )}
          <Form.Label>Your response:</Form.Label>
          <Form.Control
            type="textarea"
            {...register('message')}
            placeholder="Message"
            rows="4"
            isValid={isSubmitted && !errors.message}
            isInvalid={isSubmitted && !!errors.message}
          />
          <Form.Control.Feedback type="invalid">
            {errors.message?.message}
          </Form.Control.Feedback>
        </Modal.Body>
        <Modal.Footer>
          <br />
          <Button type="submit" name="allow" variant="success">
            Give control
          </Button>
          <Button type="submit" name="deny" variant="danger">
            Deny control
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default PassControlDialog;
