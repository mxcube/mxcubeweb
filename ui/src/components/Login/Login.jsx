import React from 'react';
import { Container,
  Row,
  Col,
  Form,
  InputGroup,
  Alert,
  Button } from 'react-bootstrap';

import { useNavigate } from 'react-router-dom';

import logo from '../../img/mxcube_logo20.png';
import loader from '../../img/loader.gif';
import './Login.css';
import SelectProposal from './SelectProposal';
import withRouter from '../WithRouter'

class LoginComponent extends React.Component {
  constructor(props) {
    super(props);

    this.signIn = this.signIn.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  signIn(event) {
    event.preventDefault();
    const username = this.loginID.value;
    const password = this.password.value;
    const {navigate} = this.props.router;

    this.props.setLoading(true);
    this.props.signIn(username.toLowerCase(), password, navigate);

  }

  handleKeyPress(target) {
    if (target.charCode === 13) {
      this.signIn();
    }
  }

  render() {
    if (this.props.loading && !this.props.showProposalsForm) {
      return <img src={loader} className="centered" role="presentation" />;
    }

    return (
      <Container>
          { this.props.showProposalsForm ?
            <SelectProposal
              show
              hide={this.props.hideTaskParametersForm}
              data={this.props.data}
              selectedProposal={this.props.selectedProposal}
              selectProposal={this.props.selectProposal}
              sendSelectProposal={this.props.sendSelectProposal}
              singOut={()=>this.props.doSignOut(this.props.navigate)}

            />
            : null
          }
          <Row>
            <Col xs={4}>
              <Form onSubmit={this.signIn} className="loginBox">
                <Row>
                  <center>
                    <img src={logo} role="presentation"
                      style={{ width: '80px', marginBottom: '30px' }}
                    />
                    <span className="title">MXCuBE 3</span>
                  </center>
                </Row>
              <Row>
                <Col xs={12}>
                  <Form.Group className="mb-3">
                    <InputGroup>
                      <span className="input-group-text">
                        <i className="fas fa-user" />
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="LoginID"
                        autoFocus
                        required
                        ref={(ref) => { this.loginID = ref; }}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <Form.Group className="mb-3">
                    <InputGroup>
                      <span className="input-group-text">
                        <i className="fas fa-lock" />
                      </span>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        required
                        onKeyPress={this.handleKeyPress}
                        ref={(ref) => { this.password = ref; }}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{ marginTop: '10px', marginBottom: '10px' }}>
                <Col xs={12} className="d-grid gap-2">
                  <Button type="submit" size="lg" className="primary" >Sign in</Button>
                </Col>
              </Row>
              {(this.props.showError ? <Alert variant="danger"><h4>Login failed</h4></Alert> : '')}
            </Form>
          </Col>
        </Row>
      </Container>
    );
  }
}

LoginComponent = withRouter(LoginComponent);
export default LoginComponent;