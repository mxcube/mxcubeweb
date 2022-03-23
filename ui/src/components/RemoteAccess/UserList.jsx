import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Button, Card } from 'react-bootstrap';
import { sendGiveControl, sendLogoutUser } from '../../actions/remoteAccess';

class UserList extends React.Component {
  getObservers() {
    const observers = [];

    for (const observer of this.props.remoteAccess.observers) {
      observers.push((
        <div key={observer.username}>
          <div className="col-xs-4">
            <span style={{ lineHeight: '24px' }}>{observer.nickname}</span>
          </div>
          <div className="col-xs-3">
            <span style={{ lineHeight: '24px' }}>{observer.ip}</span>
          </div>
          { this.props.login.user.inControl ?
            (<div className="col-xs-5">
               <Button className="btn-sm" onClick={() => this.props.sendGiveControl(observer.username)}>
                 Give control
               </Button>
               { this.props.login.user.isstaff ?
                 (<span>
                   &nbsp;
                   <Button className="btn-sm" onClick={() => this.props.sendLogoutUser(observer.username)}>
                     Logout
                   </Button>
                  </span>)
                 :
                 null
               }
             </div>)
            :
            (<div className="col-xs-4"><span>&nbsp;</span></div>)
          }
        </div>
      ));
    }

    return observers;
  }

  render() {
    return (
      <Card className="mb-3">
        <Card.Header>Users</Card.Header>
        <Card.Body>
          <Row className="col-xs-12">
            <Col className="col-xs-4"><b>Name</b></Col>
            <Col className="col-xs-4"><b>Host</b></Col>
            <Col className="col-xs-4"><span>&nbsp;</span></Col>
            {this.getObservers()}
          </Row>
        </Card.Body>
      </Card>
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
    sendGiveControl: bindActionCreators(sendGiveControl, dispatch),
    sendLogoutUser: bindActionCreators(sendLogoutUser, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserList);
