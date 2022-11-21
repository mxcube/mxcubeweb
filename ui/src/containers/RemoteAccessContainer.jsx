import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Container, Card, Form, Row, Col } from 'react-bootstrap';

import RequestControlForm from '../components/RemoteAccess/RequestControlForm';
import UserList from '../components/RemoteAccess/UserList';

import { sendAllowRemote, sendTimeoutGivesControl } from '../actions/remoteAccess';

export class RemoteAccessContainer extends React.Component {
  getRAOptions() {
    let content = (
      <Col sm={4} >
        <Card className="mb-3">
          <Card.Header>
            RA Options
          </Card.Header>
          <Card.Body>
            <Form.Check
              type="checkbox"
              onChange={(e) => this.props.sendAllowRemote(e.target.checked)}
              checked={this.props.remoteAccess.allowRemote}
              label="Enable remote access"
            />
            <Form.Check
              type="checkbox"
              onChange={(e) => this.props.sendTimeoutGivesControl(e.target.checked)}
              checked={this.props.remoteAccess.timeoutGivesControl}
              label="Timeout gives control"
            />

          </Card.Body>
        </Card>
      </Col>);

    if (!this.props.login.user.isstaff) {
      content = null;
    }

    return content;
  }

  render() {
    return (
      <Container fluid className='mt-4'>
        <Row sm={12} className="d-flex">
          { !this.props.login.user.inControl ?
            (<Col sm={4} className="col-xs-4">
              <RequestControlForm />
            </Col>) : null
          }
          <Col sm={4} className="mb-3">
            <UserList />
          </Col>
          {this.getRAOptions()}
        </Row>
      </Container>
    );
  }
}


function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
    login: state.login
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendAllowRemote: bindActionCreators(sendAllowRemote, dispatch),
    sendTimeoutGivesControl: bindActionCreators(sendTimeoutGivesControl, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RemoteAccessContainer);
