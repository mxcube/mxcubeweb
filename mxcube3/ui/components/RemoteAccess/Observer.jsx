import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Input, ButtonInput } from 'react-bootstrap';
import { setLoading } from '../../actions/general';
import { requestControl } from '../../actions/remoteAccess';

export default class Observer extends React.Component {
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
    const message = this.refs.message.refs.input.value;
    const name = this.refs.name.refs.input.value;

    this.props.requestControl(true, message, name, this.props.login.loginInfo);
  }

  cancelControlRequest() {
    this.props.requestControl(false);
  }

  render() {
    return (
      <div>
        <form className="col-md-5">
          <Input
            ref="name"
            label="Name"
            id="name"
            type="text"
            defaultValue={this.getName()}
          />
          <Input
            ref="message"
            label="Message"
            id="message"
            type="textarea"
            defaultValue="Please give me control"
            rows="3"
          />
          <ButtonInput
            id="submit"
            bsStyle="primary"
            value="Ask for control"
            onClick={this.askForControl}
          />
        </form>
      </div>
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
    askForControlDialog: bindActionCreators(setLoading, dispatch),
    requestControl: bindActionCreators(requestControl, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Observer);

