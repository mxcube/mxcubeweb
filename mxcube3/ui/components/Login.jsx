'use strict';
import ReactDOM from 'react-dom';
import React, { Component, PropTypes } from 'react'
import { Redirect, Router, Route } from 'react-router';
import classNames from 'classnames';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Input, ButtonInput, Form, Well } from "react-bootstrap";
import './Login.css';
import Main_login from './Main_login'
import SampleViewContainer from '../containers/SampleViewContainer'
import SampleGridContainer from '../containers/SampleGridContainer'
import { Logging } from './Logging'

var LoginForm = React.createClass({

getInitialState: function() {
    return {
      login_info: {synchrotron_name: " ", beamline_name: " ", loginType: ""}
    };
  },
  componentDidMount: function(){
    $.ajax({
     url: '/mxcube/api/v0.1/login_info',
     type: 'GET',
     success: function(data) {
      this.setState({login_info: data});
      // console.log(data);
     }.bind(this),
     error: function(error) {
      console.log(error);
     }.bind(this)
   });
  },

  signIn: function() {
      let proposal = this.refs.proposal.getValue();
      let password = this.refs.password.getValue();
      this.props.signIn(proposal, password);
      $("#submit").prop('disabled', true);
      $("#ajax_loader").toggleClass('hidden',false);
  },

  logOut: function() {
      this.props.signOut();
  },

  render: function () {
    var login_input_form = "";
    var ok = false;
    var loginType= this.state.login_info.loginType;
    var beamline = this.state.login_info.beamline_name;
    var synchrotron = this.state.login_info.synchrotron_name;

    try {
        ok = this.props.status.code == 'ok';
    } catch(e) {
        ok = false;
    } finally {
       if (ok) {
      login_input_form = (
      <Router>
        <Route path="/" component={Main_login}>
                <Route path="samplegrid" component={SampleGridContainer}/>
                <Route path="datacollection" component={SampleViewContainer}/>
                <Route path="logging" component={Logging}/>
        </Route>
      </Router>
      )

        } else {
        $("#submit").prop('disabled', false);
        $("#ajax_loader").toggleClass('hidden',true);
        login_input_form = (
          <div>
          <div className="row row-centered">
          <div>
           <img src="img/mxcube_logo20.png" className="img-logo"/>
          </div>
          <h3 >Welcom to  {beamline} at {synchrotron}</h3>
          <div className="col-md-5 col-centered">
          <div className="well well-left h5">
             <div>
                <form className="form from-actions" bsStyle="inline" >
                  <Input  label="LoginID" ref="proposal" type="text" name="proposal" placeholder={loginType} required autofocus/>{' '}
                  <Input  label="Password"  ref="password" type="password" name="password" placeholder="Password" required onKeyPress={(target) => { if (target.charCode==13) { this.signIn() }}}/>{' '}
                  <ButtonInput id="submit" bsStyle="primary"  value="Sign in"  onClick={this.signIn}/>
                </form>
              </div>
             </div>
             <div id="ajax_loader" className="hidden">
               <img src="img/loader.gif" className="img-responsive"/>
             </div>
            </div>
            </div>
          </div>
          );
        }
    }
    return (login_input_form);
  }
});

module.exports = LoginForm;
