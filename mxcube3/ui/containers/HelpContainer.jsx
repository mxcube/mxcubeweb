import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Panel, Button, FormGroup, Form, FormControl, ControlLabel } from 'react-bootstrap';

import { sendMail } from '../actions/login';

export class HelpContainer extends React.Component {
  constructor(props) {
    super(props);
    this.sendMail = this.sendMail.bind(this);
    this.sender = '';
    this.content = '';
  }

  sendMail() {
    this.props.sendMail(this.sender.value, this.content.value);
  }

  render() {
    return (
      <div className="col-xs-12" style={{ marginTop: '2em' }}>
        <div className="col-xs-4">
          <Panel header="Local Contact">
            <span>
              Name: <br />
              Email: <br />
              Tel: <br />
            </span>
          </Panel>
          <Panel header="Contact us">
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

        </div>
        <div className="col-xs-6">
          <Panel header="Video Tutorials">
            <div className="col-xs-4">
              <span>
                <b>Characterisation </b> <br />
                <video width="230" height="132" controls>
                  <source src={"../help_videos/mx3-characterisation.ogv"} type="video/mp4" />
                </video>
              </span>
            </div>
            <div className="col-xs-4">
              <span>
                <b>Interleaved </b> <br />
                <video width="230" height="132" controls>
                  <source src={"../help_videos/mx3-interleaved.ogv"} type="video/mp4" />
                </video>
              </span>
            </div>
            <div className="col-xs-4">
              <span>
                <b>Mesh </b> <br />
                <video width="230" height="132" controls>
                  <source src={"../help_videos/mx3-mesh.ogv"} type="video/mp4" />
                </video>
              </span>
            </div>
          </Panel>
        </div>
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    remoteAccess: state.login
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendMail: bindActionCreators(sendMail, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HelpContainer);
