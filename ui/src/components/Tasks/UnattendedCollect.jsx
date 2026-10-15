/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Button, ButtonToolbar, Form, Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';

import { DraggableModal } from '../DraggableModal';
import { FieldsHeader, FieldsRow, InputField } from './fields';

class UnattendedCollect extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
  }

  submitAddToQueue() {
    this.props.handleSubmit(this.addToQueue.bind(this, false))();
  }

  submitRunNow() {
    this.props.handleSubmit(this.addToQueue.bind(this, true))();
  }

  addToQueue(runNow, params) {
    const parameters = {
      ...params,
      type: 'UnattendedCollect',
      label: 'Unattended collect',
      shape: -1,
    };

    // Form gives us all parameter values in strings so we need to transform numbers back
    const stringFields = [
      'type',
      'label',
      'shape',
      'method',
      'prefix',
      'subdir',
      'path',
      'prefixTemplate',
      'subDirTemplate',
      'experiment_type',
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  render() {
    const { sampleIds } = this.props;
    const count = Array.isArray(sampleIds) ? sampleIds.length : 1;

    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Unattended collect</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            For {count === 1 ? 'the sample' : `each of the ${count} samples`},
            the queue mounts it, centres it optically and with X-rays, collects
            with the parameters below, and unmounts it.
          </p>
          <FieldsHeader title="Acquisition" />
          <Form>
            <FieldsRow>
              <InputField
                propName="osc_start"
                type="number"
                label="Oscillation start"
              />
              <InputField
                propName="osc_range"
                type="number"
                label="Oscillation range"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="exp_time"
                type="number"
                label="Exposure time (s)"
              />
              <InputField
                propName="num_images"
                type="number"
                label="Number of images"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="transmission"
                type="number"
                label="Transmission"
              />
              <InputField
                propName="resolution"
                type="number"
                label="Resolution"
              />
            </FieldsRow>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar className="float-end">
            <Button
              variant="success"
              disabled={this.props.invalid}
              onClick={this.submitRunNow}
            >
              Run Now
            </Button>
            <Button
              className="ms-3"
              variant="primary"
              disabled={this.props.invalid}
              onClick={this.submitAddToQueue}
            >
              {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
            </Button>
          </ButtonToolbar>
        </Modal.Footer>
      </DraggableModal>
    );
  }
}

const UnattendedCollectForm = reduxForm({
  form: 'unattendedcollect',
})(UnattendedCollect);

export default connect((state) => ({
  initialValues: { ...state.taskForm.taskData.parameters },
}))(UnattendedCollectForm);
