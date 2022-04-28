import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, Button, Card } from 'react-bootstrap';
import { setLoading } from '../../actions/general';
import { requestControl, sendTakeControl } from '../../actions/remoteAccess';

class RequestControlForm extends React.Component {
  constructor(props) {
    super(props);
    this.askForControl = this.askForControl.bind(this);
    this.cancelControlRequest = this.cancelControlRequest.bind(this);
    this.getTakeControlOption = this.getTakeControlOption.bind(this);
    this.takeControlOnClick = this.takeControlOnClick.bind(this);
  }

  componentDidUpdate() {
    this.name.value = this.props.login.user.nickname;
  }

  getTakeControlOption() {
    let content = (<span style={{ marginLeft: '1em' }}>
                     <Button size='sm' variant='outline-secondary' onClick={this.takeControlOnClick}>Take control</Button>
                   </span>);

    if (!this.props.login.user.isstaff) {
      content = null;
    }

    return content;
  }

  getName() {
    let name = '';

    try {
      name = this.props.login.user.nickname;
    } catch (e) {
      name = '';
    }

    return name;
  }

  takeControlOnClick() {
    this.props.sendTakeControl();
  }

  askForControl() {
    this.props.askForControlDialog(true, 'Asking for control',
      'Please wait while asking for control',
      true, this.cancelControlRequest);
    const message = this.message.value;
    const name = this.name.value;

    this.props.requestControl(true, message, name, this.props.login.user);
  }

  cancelControlRequest() {
    const message = this.message.value;
    const name = this.name.value;

    this.props.requestControl(false, message, name, this.props.login.user);
  }

  render() {
    return (
      <Card>
        <Card.Header>
          Request control
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control
                className='mb-3'
                ref={(ref) => { this.name = ref; }}
                type="text"
                defaultValue={this.getName()}
              />
            </Form.Group>
            <Form.Group className='mb-3'>
              <Form.Label>Message</Form.Label>
              <Form.Control
                ref={(ref) => { this.message = ref; }}
                as="textarea" 
                defaultValue="Please give me control"
                rows={3}
              />
            </Form.Group>
            <Button
              variant="outline-secondary"
              size ='sm'
              onClick={this.askForControl}
            >
              Ask for control
            </Button>
            {this.getTakeControlOption()}
          </Form>
        </Card.Body>
      </Card>);
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
    askForControlDialog: bindActionCreators(setLoading, dispatch),
    requestControl: bindActionCreators(requestControl, dispatch),
    sendTakeControl: bindActionCreators(sendTakeControl, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RequestControlForm);

