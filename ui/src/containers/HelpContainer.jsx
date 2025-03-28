import React from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { connect } from 'react-redux';

import { sendFeedback } from '../api/login';
import characterisation from '../help_videos/mx3-characterisation.ogv';
import interleaved from '../help_videos/mx3-interleaved.ogv';
import mesh from '../help_videos/mx3-mesh.ogv';

export class HelpContainer extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.sender = '';
    this.content = '';
  }

  handleSubmit() {
    sendFeedback(this.sender.value, this.content.value);
    this.sender.value = '';
    this.content.value = '';
  }

  localContactPanel() {
    let panel = null;

    if (this.props.login.user) {
      const familyName = this.props.login.user.nickname || '';
      const givenName = this.props.login.user.nickname || '';
      const email = this.props.login.user.email || '';
      const tel = '';

      panel = (
        <Card className="mb-3">
          <Card.Header>
            <span>Local Contact</span>
            <span className="me-3 position-absolute end-0">
              <i className="fas fa-user" />
            </span>
          </Card.Header>
          <Card.Body>
            <span>
              Name: {givenName} {familyName}
              <br />
              Email: {email}
              <br />
              Tel: {tel} <br />
            </span>
          </Card.Body>
        </Card>
      );
    }
    return panel;
  }

  render() {
    let links = [];

    if (import.meta.env.VITE_HELP_LINKS) {
      links = import.meta.env.VITE_HELP_LINKS.map((link) => (
        // eslint-disable-next-line react/jsx-key
        <div>
          <a target="_blank" href={link.url} rel="noreferrer">
            {link.name}
          </a>
        </div>
      ));
    }

    return (
      <Container fluid className="mt-4">
        <Row>
          <Col sm={12} className="d-flex">
            <Col sm={4}>
              {this.localContactPanel()}
              <Card className="mb-3">
                <Card.Header>
                  <span>Feedback</span>
                  <span className="me-3 position-absolute end-0">
                    <i className="fas fa-envelope" />
                  </span>
                </Card.Header>

                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="EmailAddress">
                        Your email, Name or Proposal
                      </Form.Label>
                      <Form.Control
                        required
                        type="email"
                        id="EmailAddress"
                        placeholder="Your contact information (email, Name or Proposal)"
                        ref={(ref) => {
                          this.sender = ref;
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="Content">Content : </Form.Label>
                      <Form.Control
                        required
                        as="textarea"
                        rows={7}
                        id="Content"
                        placeholder="Let us know whats on your mind !"
                        ref={(ref) => {
                          this.content = ref;
                        }}
                      />
                    </Form.Group>
                    <Form.Group className="jus">
                      <Button onClick={this.handleSubmit}>Submit</Button>
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>
              <Card className="mb-2">
                <Card.Header>
                  <span>About MXCuBE-Web</span>
                </Card.Header>
                <Card.Body>
                  <span>Version: {this.props.general.serverVersion}</span>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={1} />
            <Col xs={7}>
              <Card className="mb-2">
                <Card.Header>Video Tutorials</Card.Header>
                <Card.Body>
                  <Row>
                    <Col className="col-xs-4">
                      <span>
                        <b>Characterisation </b> <br />
                        <video width="230" height="132" controls>
                          <source src={characterisation} type="video/mp4" />
                        </video>
                      </span>
                    </Col>
                    <Col className="col-xs-4">
                      <span>
                        <b>Interleaved </b> <br />
                        <video width="230" height="132" controls>
                          <source src={interleaved} type="video/mp4" />
                        </video>
                      </span>
                    </Col>
                    <Col className="col-xs-4">
                      <span>
                        <b>Mesh </b> <br />
                        <video width="230" height="132" controls>
                          <source src={mesh} type="video/mp4" />
                        </video>
                      </span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              {import.meta.env.VITE_HELP_LINKS ? (
                <Card
                  header={
                    <div>
                      <span>Help Links</span>
                      <span className="me-3 position-absolute end-0">
                        <i className="fas fa-info-circle" />
                      </span>
                    </div>
                  }
                >
                  <span>{links}</span>
                </Card>
              ) : null}
            </Col>
          </Col>
        </Row>
      </Container>
    );
  }
}

function mapStateToProps(state) {
  return {
    login: state.login,
    general: state.general,
  };
}

export default connect(mapStateToProps)(HelpContainer);
