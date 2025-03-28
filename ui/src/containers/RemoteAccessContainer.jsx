import { Container, Card, Form, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import {
  updateAllowRemote,
  updateTimeoutGivesControl,
} from '../actions/remoteAccess';
import RequestControlForm from '../components/RemoteAccess/RequestControlForm';
import UserList from '../components/RemoteAccess/UserList';

function RemoteAccessContainer() {
  const dispatch = useDispatch();

  const remoteAccess = useSelector((state) => state.remoteAccess);
  const inControl = useSelector((state) => state.login.user.inControl);

  return (
    <Container fluid className="mt-4">
      <Row sm={12} className="d-flex">
        {!inControl && (
          <Col sm={4} className="col-xs-4">
            <RequestControlForm />
          </Col>
        )}
        <Col sm={4} className="mb-3">
          <UserList />
        </Col>
        <Col sm={4}>
          <Card className="mb-3">
            <Card.Header>Options</Card.Header>
            <Card.Body>
              <Form.Check
                type="checkbox"
                onChange={(e) => dispatch(updateAllowRemote(e.target.checked))}
                checked={remoteAccess.allowRemote}
                label="Enable remote access"
                id="allow-remote"
              />
              <Form.Check
                type="checkbox"
                onChange={(e) =>
                  dispatch(updateTimeoutGivesControl(e.target.checked))
                }
                checked={remoteAccess.timeoutGivesControl}
                label="Timeout gives control"
                id="timeout-gives-control"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RemoteAccessContainer;
