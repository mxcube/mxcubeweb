import React from 'react';
import { Grid, Row, Col, FormGroup, FormControl, ControlLabel, Alert, Button } from 'react-bootstrap';
import logo from '../../img/mxcube_logo20.png';
import loader from '../../img/loader.gif';
import './Login.css';

export default class LoginComponent extends React.Component {
  constructor(props) {
    super(props);

    this.signIn = this.signIn.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  signIn() {
    const username = this.loginID.value;
    const password = this.password.value;
    this.props.setLoading(true);
    this.props.signIn(username, password);
  }

  handleKeyPress(target) {
    if (target.charCode === 13) {
      this.signIn();
    }
  }

  render() {
    if (this.props.loading) {
      return <img src={loader} className="centered" role="presentation" />
    }

    return (<Grid>
        {(this.props.showError ? <Alert bsStyle="danger"><h4>Authentification invalide.</h4></Alert> : '')}
        <Row>
          <center>
            <img src={logo} style={{ width: '192px', height: '248px', marginTop: '50px'}} />
            <h3 style={{marginBottom: '15px'}}>Welcome to XXX at YYY</h3>
          </center>
        </Row>
        <Row>
          {(this.props.showError ? <Alert bsStyle="danger"><h4>Failed Sign In</h4></Alert> : '')}
          <Col xs={4} xsOffset={4}>
            <Row>
              <Col xs={12}>
                <FormGroup>
                  <ControlLabel>LoginID</ControlLabel>                  
                  <FormControl type="text" placeholder="LoginID" autoFocus required inputRef={(ref)=>{this.loginID=ref}}/>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <FormGroup>
                  <ControlLabel>Password</ControlLabel>
                  <FormControl type="password" placeholder="Password" required onKeyPress={this.handleKeyPress} inputRef={(ref)=>{this.password=ref}}/>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <Button block bsStyle="primary" onClick={this.signIn}>Sign in</Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Grid>);
  }
}

