import React from 'react';
import { withRouter } from "react-router";
import { Grid, Row, Col, FormGroup, FormControl, ControlLabel, Alert, Button } from 'react-bootstrap';
import logo from '../../img/mxcube_logo20.png';
import loader from '../../img/loader.gif';
import './Login.css';

class LoginComponent extends React.Component {
  constructor(props) {
    super(props);
    this.signIn = this.signIn.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.status.code === 'ok') {
      this.props.router.push("/");
    }
  }

  signIn() {
    this.props.setLoading(true);
    const username = this.loginID.value;
    const password = this.password.value;
    this.props.signIn(username, password);
  }

  handleKeyPress(target) {
    if (target.charCode === 13) {
      this.signIn();
    }
  }

  render() {
    const loginInfo = this.props.loginInfo;

    if (this.props.loading) {
      return <img src={loader} className="centered" alt="" />
    }

    return (<Grid>
        {(this.props.showError ? <Alert bsStyle="danger"><h4>Authentification invalide.</h4></Alert> : '')}
        <Row>
          <center>
            <img src={logo} style={{ width: '192px', height: '248px', marginTop: '50px'}} />
            <h3 style={{marginBottom: '15px'}}>Welcome to {loginInfo.beamline_name} at {loginInfo.synchrotron_name}</h3>
          </center>
        </Row>
        <Row>
          {(this.props.showError ? <Alert bsStyle="danger"><h4>Failed Sign In</h4></Alert> : '')}
          <Col xs={4} xsOffset={4}>
            <Row>
              <Col xs={12}>
                <FormGroup>
                  <ControlLabel>LoginID</ControlLabel>                  
                  <FormControl type="text" placeholder={loginInfo.loginType} autoFocus required inputRef={(ref)=>{this.loginID=ref}}/>
                </FormGroup>
                <FormGroup>
                  <ControlLabel>Password</ControlLabel>
                  <FormControl type="password" placeholder="Password" required inputRef={(ref)=>{this.password=ref}}/>
                </FormGroup>
                <Button block bsStyle="primary" onClick={this.signIn}>Sign in</Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Grid>);
  }
}

var Login = withRouter(LoginComponent);

export default Login;
