import React from 'react';
import { connect } from 'react-redux';
import { Panel, Button, FormGroup, Form, FormControl, ControlLabel } from 'react-bootstrap';

import { sendMail } from '../actions/login';

import characterisation from '../help_videos/mx3-characterisation.ogv';
import interleaved from '../help_videos/mx3-interleaved.ogv';
import mesh from '../help_videos/mx3-mesh.ogv';

import config from 'guiConfig';

export class HelpContainer extends React.Component {
  constructor(props) {
    super(props);
    this.sendMail = this.sendMail.bind(this);
    this.sender = '';
    this.content = '';
  }

  sendMail() {
    sendMail(this.sender.value, this.content.value);
    this.sender.value = '';
    this.content.value = '';
  }

  localContactPanel() {
    const loginRes = this.props.login.loginRes;
    let panel = null;

    if (loginRes) {
      const familyName = loginRes.local_contact.familyName || '';
      const givenName = loginRes.local_contact.givenName || '';
      const email = loginRes.local_contact.emailAddress || '';
      const tel = loginRes.local_contact.phoneNumber || '';

      panel = (
        <Panel header={
          <div>
            <span>Local Contact</span>
            <span className="glyphicon glyphicon-user pull-right" ></span>
          </div>}
        >
         <span>
           Name: `${givenName} ${familyName}`<br />
           Email: {email}<br />
           Tel: {tel} <br />
         </span>
       </Panel>);
    }
    return panel;
  }

  render() {
    let links = [];

    if (config.helpLinks) {
      links = config.helpLinks.map((link) =>
          <div><a target="_blank" href={link.url}>{link.name}</a></div>);
    }

    return (
      <div className="col-xs-12" style={{ marginTop: '2em', zIndex: 9999 }}>
        <div className="col-xs-4">
          {this.localContactPanel()}
          <Panel header={
            <div>
              <span>Feedback</span>
              <span className="glyphicon glyphicon-envelope pull-right" ></span>
            </div>}
          >
           <span>
              <Form>
                <FormGroup>
                  <ControlLabel>Your email, Name or Proposal</ControlLabel>
                  <FormControl
                    type="email"
                    label="Email address"
                    placeholder="Your contact information (email, Name or Proposal)"
                    inputRef={ (input) => {this.sender = input;} }
                  />
                </FormGroup>
                <FormGroup>
                  <ControlLabel>Content:</ControlLabel>
                  <FormControl
                    componentClass="textarea"
                    rows="7"
                    label="Content"
                    placeholder="Let us know whats on your mind !"
                    inputRef={ (input) => {this.content = input;} }
                  />
                </FormGroup>
                <FormGroup>
                  <Button type="button" onClick={this.sendMail}>Submit</Button>
                </FormGroup>
              </Form>
            </span>
          </Panel>
          <Panel header="About MXCuBE3">
            <span>
              Version: {/* eslint-disable no-undef */ VERSION.BRANCH}
              <br />
              Commit hash: { VERSION.COMMITHASH /* eslint-enable no-undef */}
            </span>
          </Panel>
        </div>
        <div className="col-xs-6">
          <Panel header="Video Tutorials">
            <div className="col-xs-4">
              <span>
                <b>Characterisation </b> <br />
                <video width="230" height="132" controls>
                  <source src={characterisation} type="video/mp4" />
                </video>
              </span>
            </div>
            <div className="col-xs-4">
              <span>
                <b>Interleaved </b> <br />
                <video width="230" height="132" controls>
                  <source src={interleaved} type="video/mp4" />
                </video>
              </span>
            </div>
            <div className="col-xs-4">
              <span>
                <b>Mesh </b> <br />
                <video width="230" height="132" controls>
                  <source src={mesh} type="video/mp4" />
                </video>
              </span>
            </div>
          </Panel>
          { config.helpLinks ?
            (<Panel header={
              <div>
                <span>Help Links</span>
                <span className="glyphicon glyphicon-info-sign pull-right" ></span>
              </div>}
            >
              <span>
              {links}
              </span>
            </Panel>) : null
           }
        </div>
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    login: state.login
  };
}


export default connect(
  mapStateToProps
)(HelpContainer);
