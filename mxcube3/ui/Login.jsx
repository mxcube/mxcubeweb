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
        let username = this.refs.username.getValue();
        let password = this.refs.password.getValue();
        $.ajax({ url: 'login', type: 'GET', data: { username: username, password: password }, success: function(res) {
            
        }});
    }

    render() {
	return (<Nav right eventKey={0}>
            <form className="navbar-form" action="">
              <Input bsSize="small" ref="username" type="text" name="username" placeholder="Username"/>&nbsp;
              <Input bsSize="small" ref="password" type="password" name="password" placeholder="Password"/>&nbsp;
              <ButtonInput bsSize="small" bsStyle="info" value="Sign in" onClick={this.signIn.bind(this)}/>
            </form>
        </Nav>);
    }    
}
