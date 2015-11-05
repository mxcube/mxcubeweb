import ReactDOM from 'react-dom';
import React from 'react';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Nav, Input, ButtonInput } from "react-bootstrap";

export default class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { proposal: null };
    }

    signIn() {
        let proposal = this.refs.proposal.getValue();
        let password = this.refs.password.getValue();
        $.ajax({ url: 'login', type: 'GET', data: { proposal: proposal, password: password }, success: function(res) {
           this.setState("proposal", res); 
        }});
    }

    render() {
        let login_input_form = "";
        if (this.state.proposal) {
            login_input_form = (<p className="text-info">{this.state.proposal.Proposal.title}</p>)
        } else {
            login_input_form = (<form className="navbar-form" action=""><Input bsSize="small" ref="proposal" type="text" name="proposal" placeholder="Proposal"/>{' '}
              <Input bsSize="small" ref="password" type="password" name="password" placeholder="Password"/>{' '}
              <ButtonInput bsSize="xsmall" bsStyle="info" value="Sign in" onClick={this.signIn.bind(this)}/></form>);
        }
	return (<Nav right eventKey={0}>
              {login_input_form}
        </Nav>);
    }    
}
