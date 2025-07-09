import { useEffect } from 'react';
import { Button, ButtonToolbar, Col, Form, Modal, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { addSampleAndMount, addSamplesToQueue } from '../../actions/queue';
import { showList } from '../../actions/queueGUI';
import { addSamplesToList } from '../../actions/sampleGrid';
import { hideTaskParametersForm } from '../../actions/taskForm';

const REQUIRED_MSG = 'This field is required';
const PATTERN = /^[\w+\-:]*$/u;
const PATTERN_MSG = 'Characters allowed: A-Z a-z 0-9 _+:-';

function getSampleData(params) {
  return {
    ...params,
    type: 'Sample',
    defaultPrefix: `${params.proteinAcronym}-${params.sampleName}`,
    location: 'Manual',
    loadable: true,
    tasks: [],
  };
}

function AddSample() {
  const { register, formState, handleSubmit, setFocus } = useForm();
  const { isSubmitted, errors } = formState;

  const dispatch = useDispatch();
  const { pathname } = useLocation();

  useEffect(() => {
    // Timeout required when creating new sample from "Samples" page
    setTimeout(() => setFocus('sampleName'), 0);
  }, [setFocus]);

  async function addAndMount(params) {
    const sampleData = getSampleData(params);
    dispatch(addSamplesToList([sampleData]));
    dispatch(hideTaskParametersForm());

    await dispatch(addSampleAndMount(sampleData));

    if (pathname === '/' || pathname === '/datacollection') {
      // Switch to mounted sample tab
      dispatch(showList('current'));
    }
  }

  function addAndQueue(params) {
    const sampleData = getSampleData(params);
    dispatch(addSamplesToList([sampleData]));
    dispatch(addSamplesToQueue([sampleData]));
    dispatch(hideTaskParametersForm());
  }

  return (
    <Modal
      show
      onHide={() => dispatch(hideTaskParametersForm())}
      data-default-styles
    >
      <Form noValidate onSubmit={handleSubmit(addAndMount)}>
        <Modal.Header closeButton>
          <Modal.Title>New Sample</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group as={Row} className="mb-3" controlId="sampleName">
            <Col sm={4}>
              <Form.Label column>Sample name</Form.Label>
            </Col>
            <Col sm={8}>
              <Form.Control
                type="text"
                {...register('sampleName', {
                  required: REQUIRED_MSG,
                  pattern: { value: PATTERN, message: PATTERN_MSG },
                })}
                isValid={isSubmitted && !errors.sampleName}
                isInvalid={isSubmitted && !!errors.sampleName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.sampleName?.message}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3" controlId="proteinAcronym">
            <Col sm={4}>
              <Form.Label column>Protein acronym</Form.Label>
            </Col>
            <Col sm={8}>
              <Form.Control
                type="text"
                {...register('proteinAcronym', {
                  required: REQUIRED_MSG,
                  pattern: { value: PATTERN, message: PATTERN_MSG },
                })}
                isValid={isSubmitted && !errors.proteinAcronym}
                isInvalid={isSubmitted && !!errors.proteinAcronym}
              />
              <Form.Control.Feedback type="invalid">
                {errors.proteinAcronym?.message}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar>
            <Button className="me-3" type="submit">
              Mount
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleSubmit(addAndQueue)}
            >
              Queue
            </Button>
          </ButtonToolbar>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default AddSample;
