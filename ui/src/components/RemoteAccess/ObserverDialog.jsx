/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import {
  showObserverDialog,
  sendUpdateNickname,
} from '../../actions/remoteAccess';

export class ObserverDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
    this.show = this.show.bind(this);
  }

  componentDidUpdate() {
    if (this.name && this.name.value === '') {
      try {
        this.name.value = this.props.login.user.nickname;
      } catch {
        this.name.value = '';
      }
    }
  }

  show() {
    return (
      !this.props.login.user.inControl && this.props.login.user.nickname === ''
    );
  }

  accept() {
    const name = this.name ? this.name.value : this.props.login.loginID;

    if (name) {
      this.props.sendUpdateNickname(name);
    } else {
      this.props.sendUpdateNickname(this.props.login.user.username);
    }

    this.props.hide();
  }

  reject() {
    this.props.hide();
  }

  title() {
    return 'Observer mode';
  }

  render() {
    return (
      <Modal backdrop="static" show={this.show()} style={{ zIndex: 10_001 }}>
        <Modal.Header>
          <Modal.Title>{this.title()}</Modal.Title>
        </Modal.Header>
        <div>
          <Modal.Body>
            Someone else is currently using the beamline, you are going to be
            logged in as an observer.{' '}
            {this.props.login.loginType === 'User'
              ? ''
              : 'You have to enter your name to be able to continue.'}
          </Modal.Body>
          <Modal.Footer className="d-block">
            <Form onSubmit={this.accept}>
              {this.props.login.loginType === 'User' ? null : (
                <Row className="mb-3">
                  <Form.Group as={Col} sm={12}>
                    <Form.Control
                      ref={(ref) => {
                        this.name = ref;
                      }}
                      type="text"
                      defaultValue={this.props.login.loginID}
                    />
                  </Form.Group>
                </Row>
              )}
              <Row className="justify-content-end">
                <Form.Group as={Col} sm={3}>
                  <Button style={{ float: 'right' }} type="submit">
                    {' '}
                    OK{' '}
                  </Button>
                </Form.Group>
              </Row>
            </Form>
          </Modal.Footer>
        </div>
      </Modal>
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
    hide: bindActionCreators(showObserverDialog.bind(null, false), dispatch),
    sendUpdateNickname: bindActionCreators(sendUpdateNickname, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ObserverDialog);
