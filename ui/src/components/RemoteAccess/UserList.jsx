import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Button, Card } from 'react-bootstrap';
import { sendGiveControl, sendLogoutUser } from '../../actions/remoteAccess';

class UserList extends React.Component {
  getObservers() {
    const observers = [];

    for (const observer of this.props.remoteAccess.observers) {
      observers.push(
        <Row key={observer.username}>
          <Col sm={4}>
            <span style={{ lineHeight: '24px' }}>{observer.nickname}</span>
          </Col>
          <Col sm={3}>
            <span style={{ lineHeight: '24px' }}>{observer.ip}</span>
          </Col>
          <Col sm={5} />
          {this.props.login.user.inControl ? (
            <Col className="mt-3" sm={5}>
              <Button
                size="sm"
                variant="outline-secondary"
                className="me-3"
                onClick={() => this.props.sendGiveControl(observer.username)}
              >
                Give control
              </Button>
              {this.props.login.user.isstaff ? (
                <span>
                  &nbsp;
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => this.props.sendLogoutUser(observer.username)}
                  >
                    Logout
                  </Button>
                </span>
              ) : null}
            </Col>
          ) : (
            <Col sm={4}>
              <span>&nbsp;</span>
            </Col>
          )}
        </Row>,
      );
    }

    return observers;
  }

  render() {
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
          {this.getObservers()}
        </Card.Body>
      </Card>
    );
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
    login: state.login,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendGiveControl: bindActionCreators(sendGiveControl, dispatch),
    sendLogoutUser: bindActionCreators(sendLogoutUser, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserList);
