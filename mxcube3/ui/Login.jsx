import ReactDOM from 'react-dom';
import React from 'react';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Nav, Input, ButtonInput } from "react-bootstrap";

export default class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    signIn() {
        let proposal = this.refs.proposal.getValue();
        let prop_number = this.refs.prop_number.getValue();
        let password = this.refs.password.getValue();
        $.ajax({ url: 'login', type: 'GET', data: { proposal: proposal, prop_number: prop_number, password: password }, success: function(res) {
            
        }});
    }

    render() {
	return (<Nav right eventKey={0}>
            <form className="navbar-form" action="">
              <Input bsSize="small" ref="proposal" type="text" name="proposal" placeholder="Proposal"/>{' - '}
              <Input bsSize="small" ref="prop_number" type="text" name="prop_number" placeholder="Number"/>{' '}
              <Input bsSize="small" ref="password" type="password" name="password" placeholder="Password"/>{' '}
              <ButtonInput bsSize="small" bsStyle="info" value="Sign in" onClick={this.signIn.bind(this)}/>
            </form>
        </Nav>);
    }    
}
