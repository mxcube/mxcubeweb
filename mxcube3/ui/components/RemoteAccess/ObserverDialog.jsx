import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, FormControl } from 'react-bootstrap';
import { showObserverDialog, setMaster } from '../../actions/remoteAccess';

export class ObserverDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
    this.show = this.show.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.remoteAccess.master && !nextProps.remoteAccess.master) {
      this.lostControl = true;
    } else {
      this.lostControl = false;
    }
  }

  componentDidUpdate() {
    if (this.name && this.name.value === '') {
      try {
        this.name.value = this.props.loginInfo.loginRes.Person.familyName.toUpperCase();
      } catch (err) {
        this.name.value = this.props.loginInfo.loginID;
      }
    }
  }

  onHide() { }

  show() {
    return this.props.remoteAccess.showObserverDialog;
  }

  accept() {
    const name = this.name ? this.name.value : this.props.loginInfo.loginID;

    if (name) {
      this.props.setMaster(false, name);
    }

    this.props.hide();
  }

  reject() {
    this.props.hide();
  }

  title() {
    return 'Observer mode';
  }

  observerName() {
    const userLogin = (
                      <div>
                      <Modal.Body>
                        Someone else is currently using the beamline, you are going to be
                        logged in as an observer.
                      </Modal.Body>
                      <Modal.Footer>
                      <Button onClick={this.accept}> OK </Button>
                      </Modal.Footer>
                      </div>);
    const proposalLogin = (
                      <div>
                      <Modal.Body>
                        Someone else is currently using the beamline, you are going to be
                        logged in as an observer. You have to enter your name to be able to
                        continue.
                      </Modal.Body>
                      <Modal.Footer>
                      <FormControl
                        inputRef={(ref) => { this.name = ref; }}
                        type="text"
                        defaultValue={this.props.loginInfo.loginID}
                      />
                      <Button onClick={this.accept}> OK </Button>
                    </Modal.Footer>
                    </div>);
    let data;
    if (this.props.loginInfo.loginType === 'User') {
      data = userLogin;
    } else {
      data = proposalLogin;
    }
    return data;
  }

  render() {
    return (
      <Modal
        backdrop="static"
        show={this.show()}
        onHide={this.onHide}
        style={{ zIndex: 10001 }}
      >
        <Modal.Header>
          <Modal.Title>
            {this.title()}
          </Modal.Title>
        </Modal.Header>
        {this.observerName()}
      </Modal>);
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
    loginInfo: state.login.loginInfo
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(showObserverDialog.bind(this, false), dispatch),
    setMaster: bindActionCreators(setMaster, dispatch),
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ObserverDialog);
