import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, ControlLabel, FormControl, Button, FormGroup, Panel } from 'react-bootstrap';
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

  componentDidUpdate()	{
    this.name.value = this.props.remoteAccess.observerName;
  }

  getTakeControlOption() {
    let content = (<span style={{ marginLeft: '1em' }}>
                     <Button onClick={this.takeControlOnClick}>Take control</Button>
                   </span>);

    const loginRes = this.props.login.loginInfo.loginRes;

    if (loginRes && loginRes.Session && !loginRes.Session.is_inhouse) {
      content = null;
    }

    return content;
  }

  getName() {
    let name = '';

    try {
      name = this.props.remoteAccess.observerName;
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

    this.props.requestControl(true, message, name, this.props.login.loginInfo);
  }

  cancelControlRequest() {
    const message = this.message.value;
    const name = this.name.value;

    this.props.requestControl(false, message, name, this.props.login.loginInfo);
  }

  render() {
    return (
      <Panel header="Request control">
        <Form>
          <FormGroup>
            <ControlLabel>Name</ControlLabel>
            <FormControl
              inputRef={(ref) => {this.name = ref; }}
              type="text"
              defaultValue={this.getName()}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Message</ControlLabel>
            <FormControl
              inputRef={(ref) => {this.message = ref;}}
              componentClass="textarea"
              defaultValue="Please give me control"
              rows="3"
            />
            </FormGroup>
            <Button
              bsStyle="primary"
              onClick={this.askForControl}
            >
              Ask for control
            </Button>
            {this.getTakeControlOption()}
        </Form>
      </Panel>);
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

