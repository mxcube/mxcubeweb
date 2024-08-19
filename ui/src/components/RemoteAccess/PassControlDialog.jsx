import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button, Form } from 'react-bootstrap';
import { respondToControlRequest } from '../../actions/remoteAccess';

function PassControlDialog() {
  const dispatch = useDispatch();

  const inControl = useSelector((state) => state.login.user.inControl);
  const requestingObs = useSelector((state) =>
    state.remoteAccess.observers.find((o) => o.requestsControl),
  );

  function handleSubmit(evt) {
    evt.preventDefault();
    const formData = new FormData(evt.target);

    dispatch(
      respondToControlRequest(
        evt.nativeEvent.submitter.name === 'allow',
        formData.get('message'),
      ),
    );
  }

  return (
    <Modal
      show={inControl && requestingObs}
      backdrop="static"
      style={{ zIndex: 10_001 }}
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>
            {requestingObs?.nickname} is asking for control
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          User "{requestingObs?.nickname}" is asking for control:
        </Modal.Body>
        <Modal.Footer>
          <Form.Control
            name="message"
            defaultValue="Here you go !"
            type="textarea"
            placeholder="Message"
            rows="3"
          />
          <br />
          <Button type="submit" name="allow" variant="success">
            Give control to "{requestingObs?.nickname}"
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
