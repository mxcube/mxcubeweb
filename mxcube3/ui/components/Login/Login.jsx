import React from 'react';
import { Grid,
         Row,
         Col,
         FormGroup,
         InputGroup,
         FormControl,
         Alert,
         Button } from 'react-bootstrap';
import logo from '../../img/mxcube_logo20.png';
import loader from '../../img/loader.gif';
import './Login.css';
import SelectProposal from './SelectProposal';

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
    this.props.signIn(username.toLowerCase(), password);
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

    return (<Grid>
        { this.props.showProposalsForm ?
          <SelectProposal
            show
            hide={this.props.hideTaskParametersForm}
            data={this.props.data}
            selectedProposal={this.props.selectedProposal}
            selectProposal={this.props.selectProposal}
            unselectProposal={this.props.unselectProposal}
            sendSelectProposal={this.props.sendSelectProposal}
            singOut={this.props.doSignOut}
            hide={this.props.hideProposalsForm}

          />
          : null
        }
        <Row>
          <Col xs={4} xsOffset={4}>
            <div className="loginBox">
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
                <FormGroup>
                  <InputGroup>
                    <InputGroup.Addon>
                      <i className="glyphicon glyphicon-user"></i>
                    </InputGroup.Addon>
                      <FormControl type="text" placeholder="LoginID" autoFocus required
                        inputRef={(ref) => {this.loginID = ref;}}
                      />
                   </InputGroup>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <FormGroup>
                  <InputGroup>
                    <InputGroup.Addon>
                      <i className="glyphicon glyphicon-lock"></i>
                    </InputGroup.Addon>
                    <FormControl type="password" placeholder="Password" required
                      onKeyPress={this.handleKeyPress}
                      inputRef={(ref) => {this.password = ref;}}
                    />
                  </InputGroup>
                </FormGroup>
              </Col>
            </Row>
            <Row style={{ marginTop: '10px' }}>
              <Col xs={12}>
                <Button block bsStyle="primary" onClick={this.signIn}>Sign in</Button>
              </Col>
            </Row>
              {(this.props.showError ?
                <Alert bsStyle="danger"><h4>{this.props.errorMessage}</h4></Alert> :
                 '')}
          </div>
          </Col>
        </Row>
      </Grid>);
  }
}

