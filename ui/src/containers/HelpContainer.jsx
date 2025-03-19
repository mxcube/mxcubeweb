import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
  Alert,
} from 'react-bootstrap';
import { Controller, useForm } from 'react-hook-form';

import { sendFeedback } from '../api/login';

import characterisation from '../help_videos/mx3-characterisation.ogv';
import interleaved from '../help_videos/mx3-interleaved.ogv';
import mesh from '../help_videos/mx3-mesh.ogv';

const DEFAULT_HELPFORM_VALUES = { email: '', content: '' };

function HelpContainer() {
  const {
    control,
    handleSubmit: makeOnSubmit,
    reset,
    register,
    setError,
    formState: { isDirty, isSubmitSuccessful, errors },
  } = useForm({
    defaultValues: DEFAULT_HELPFORM_VALUES,
  });
  const user = useSelector((state) => state.login.user);
  const serverVersion = useSelector((state) => state.general.serverVersion);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(data) {
    try {
      await sendFeedback(data.email, data.content);
    } catch {
      setError('content', {
        type: 'manual',
        message: 'Failed to send feedback.',
      });
    }
  }

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
      setShowSuccess(true);
    }
  }, [isSubmitSuccessful, reset]);

  useEffect(() => {
    if (isDirty) {
      setShowSuccess(false);
    }
  }, [isDirty]);

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col sm={12} className="d-flex">
          <Col sm={4}>
            {user && (
              <Card className="mb-3">
                <Card.Header>
                  Local Contact
                  <i className="me-3 position-absolute end-0 fas fa-user" />
                </Card.Header>
                <Card.Body>
                  <div>Name: {user.nickname}</div>
                  <div>Email: {user.email}</div>
                </Card.Body>
              </Card>
            )}
            <Card className="mb-3">
              <Card.Header>
                Feedback
                <i className="me-3 position-absolute end-0 fas fa-envelope" />
              </Card.Header>

              <Card.Body>
                <Form onSubmit={makeOnSubmit(handleSubmit)}>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="EmailAddress">
                      Your email, Name or Proposal
                    </Form.Label>
                    <Controller
                      name="email"
                      control={control}
                      rules={{ required: 'Email is required' }}
                      render={() => (
                        <Form.Control
                          type="text"
                          id="EmailAddress"
                          placeholder="Your contact information (email, Name or Proposal)"
                          required
                          isInvalid={errors.email}
                          {...register('email')}
                        />
                      )}
                    />
                    {errors.email && (
                      <Form.Control.Feedback type="invalid">
                        {errors.email.message}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="Content">Content : </Form.Label>
                    <Controller
                      name="content"
                      control={control}
                      rules={{ required: 'Content is required' }}
                      render={() => (
                        <Form.Control
                          as="textarea"
                          rows={7}
                          id="Content"
                          placeholder="Let us know whats on your mind !"
                          required
                          isInvalid={errors.content}
                          {...register('content')}
                        />
                      )}
                    />
                    {errors.content && (
                      <Form.Control.Feedback type="invalid">
                        {errors.content.message}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group>
                    <Button type="submit">Submit</Button>
                  </Form.Group>
                  {showSuccess && (
                    <Alert
                      variant="success"
                      className="mt-3"
                      onClose={() => setShowSuccess(false)}
                      dismissible
                    >
                      Feedback sent successfully
                    </Alert>
                  )}
                </Form>
              </Card.Body>
            </Card>
            <Card className="mb-2">
              <Card.Header>About MXCuBE-Web</Card.Header>
              <Card.Body>Version: {serverVersion}</Card.Body>
            </Card>
          </Col>
          <Col sm={1} />
          <Col xs={7}>
            <Card className="mb-2">
              <Card.Header>Video Tutorials</Card.Header>
              <Card.Body>
                <Row>
                  <Col className="col-xs-4">
                    <h3>Characterisation </h3>
                    <video width="230" height="132" controls>
                      <source src={characterisation} type="video/mp4" />
                    </video>
                  </Col>
                  <Col className="col-xs-4">
                    <h3>Interleaved </h3>
                    <video width="230" height="132" controls>
                      <source src={interleaved} type="video/mp4" />
                    </video>
                  </Col>
                  <Col className="col-xs-4">
                    <h3>Mesh </h3>
                    <video width="230" height="132" controls>
                      <source src={mesh} type="video/mp4" />
                    </video>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Col>
      </Row>
    </Container>
  );
}

export default HelpContainer;
