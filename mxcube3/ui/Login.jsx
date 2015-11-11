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
        window.error_notification.clear();
        let proposal = this.refs.proposal.getValue();
        let password = this.refs.password.getValue();
        let self = this;
        $.ajax({ url: 'mxcube/api/v0.1/login', type: 'GET', data: { proposal: proposal, password: password }, success: function(res) {
           self.setState({proposal: res}); 
        }, error: function(req, error_string, exc) {
            window.error_notification.notify(error_string);
        }});
    }

    logOut() {
        this.setState({proposal: null});
    }

    render() {
        let login_input_form = "";
        if (this.state.proposal) {
            login_input_form = (<div>
                                    <p className="navbar-text" style={{float: 'none', display: 'inline-block'}}>{this.state.proposal.Proposal.title}</p>
                                    <button className="btn btn-sm btn-info" style={{marginRight: '15px'}} onClick={this.logOut.bind(this)}>Log out</button>
                               </div>);
        } else {
            login_input_form = (<form className="navbar-form" action="">
                                    <Input bsSize="small" ref="proposal" type="text" name="proposal" placeholder="Proposal"/>{' '}
                                    <Input bsSize="small" ref="password" type="password" name="password" placeholder="Password"/>{' '}
                                    <ButtonInput bsSize="small" bsStyle="info" value="Sign in" onClick={this.signIn.bind(this)}/>
                                </form>);
        }
	return (<Nav right eventKey={0}>{login_input_form}</Nav>);
    }    
}
