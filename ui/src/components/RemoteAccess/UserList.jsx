import { Button, Card, Col, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { giveControl, logoutUser } from '../../actions/remoteAccess';

function UserList() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.login.user);
  const observers = useSelector((state) => state.remoteAccess.observers);
  const operator = useSelector((state) => state.remoteAccess.operator);

  const columnSize = user.inControl ? 4 : 6;

  return (
    <Card className="mb-3">
      <Card.Header>Users</Card.Header>
      <Card.Body>
        <Row>
          <Col sm={columnSize}>
            <b>Name</b>
          </Col>
          <Col sm={columnSize}>
            <b>Host</b>
          </Col>
          {user.inControl && (
            <Col sm={columnSize}>
              <span>&nbsp;</span>
            </Col>
          )}
        </Row>
        <Row key={operator.username} className="mt-3">
          <Col sm={columnSize}>
            <span style={{ lineHeight: '24px' }}>
              <span style={{ fontWeight: 'bold' }}>In Control </span>
              {user.inControl && (
                <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                  (You){' '}
                </span>
              )}
              - {operator.nickname || <em>Not provided</em>}
            </span>
          </Col>
          <Col sm={columnSize}>
            <span style={{ lineHeight: '24px' }}>{operator.ip}</span>
          </Col>
        </Row>
        {observers.map((observer) => (
          <Row key={observer.username} className="mt-3">
            <Col sm={columnSize}>
              <span style={{ lineHeight: '24px' }}>
                {user.nickname === observer.nickname && (
                  <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                    (You) -{' '}
                  </span>
                )}
                {observer.nickname || <em>Not provided</em>}
              </span>
            </Col>
            <Col sm={columnSize}>
              <span style={{ lineHeight: '24px' }}>{observer.ip}</span>
            </Col>
            {user.inControl && (
              <Col sm={columnSize}>
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
