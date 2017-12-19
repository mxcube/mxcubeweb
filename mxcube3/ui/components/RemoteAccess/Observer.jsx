import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, ControlLabel, FormControl, Button, FormGroup } from 'react-bootstrap';
import { setLoading } from '../../actions/general';
import { requestControl } from '../../actions/remoteAccess';

class Observer extends React.Component {
  constructor(props) {
    super(props);
    this.askForControl = this.askForControl.bind(this);
    this.cancelControlRequest = this.cancelControlRequest.bind(this);
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
    return (<Form>
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
    </Form>);
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
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Observer);

