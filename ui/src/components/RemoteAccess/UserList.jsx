import { Button, Card, Col, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { giveControl, logoutUser } from '../../actions/remoteAccess';

function UserList() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.login.user);
  const observers = useSelector((state) => state.remoteAccess.observers);

  return (
    <Card className="mb-3">
      <Card.Header>Users</Card.Header>
      <Card.Body>
        <Row>
          <Col sm={4}>
            <b>Name</b>
          </Col>
          <Col sm={4}>
            <b>Host</b>
          </Col>
          <Col sm={4}>
            <span>&nbsp;</span>
          </Col>
        </Row>
        {observers.map((observer) => (
          <Row key={observer.username} className="mt-3">
            <Col sm={4}>
              <span style={{ lineHeight: '24px' }}>
                {observer.nickname || <em>Not provided</em>}
              </span>
            </Col>
            <Col sm={3}>
              <span style={{ lineHeight: '24px' }}>{observer.ip}</span>
            </Col>
            {user.inControl && (
              <Col sm={5}>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  className="me-3"
                  onClick={() => dispatch(giveControl(observer.username))}
                >
                  Give control
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => dispatch(logoutUser(observer.username))}
                >
                  Logout
                </Button>
              </Col>
            )}
          </Row>
        ))}
      </Card.Body>
    </Card>
  );
}

export default UserList;
