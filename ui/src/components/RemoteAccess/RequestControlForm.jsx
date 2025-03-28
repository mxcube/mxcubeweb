import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Card } from 'react-bootstrap';
import { requestControl, takeControl } from '../../actions/remoteAccess';

function RequestControlForm() {
  const dispatch = useDispatch();
  const nickname = useSelector((state) => state.login.user.nickname);

  function handleAskForControl(evt) {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    dispatch(requestControl(formData.get('message')));
  }

  return (
    <Card>
      <Card.Header>Request control</Card.Header>
      <Card.Body>
        <Form onSubmit={handleAskForControl}>
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              name="message"
              as="textarea"
              defaultValue={
                nickname && `Hi, it's ${nickname}, please give me control.`
              }
              rows={3}
            />
          </Form.Group>
          <Button type="submit" variant="outline-secondary">
            Ask for control
          </Button>
          <span style={{ marginLeft: '1em' }}>
            <Button
              variant="outline-secondary"
              onClick={() => dispatch(takeControl())}
            >
              Take control
            </Button>
          </span>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default RequestControlForm;
