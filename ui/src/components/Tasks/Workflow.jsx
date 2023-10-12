/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { DraggableModal } from '../DraggableModal';
import { Modal, Button, Form, Row, ButtonToolbar } from 'react-bootstrap';
import validate from './validate';
import { StaticField, InputField } from './fields';

class Workflow extends React.Component {
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
      type: 'Workflow',
      label: params.wfname,
      shape: this.props.pointID,
      suffix: this.props.suffix,
    };

    // Form gives us all parameter values in strings so we need to transform numbers back
    const stringFields = [
      'centringMethod',
      'prefix',
      'subdir',
      'type',
      'shape',
      'label',
      'wfname',
      'wfpath',
      'suffix',
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  render() {
    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.wfname}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <StaticField label="Path" data={this.props.path} />
            <StaticField label="Filename" data={this.props.filename} />
            <Row className="mt-3">
              <InputField
                propName="subdir"
                label="Subdirectory"
                col1={4}
                col2={7}
              />
            </Row>
            <Row className="mt-3">
              <InputField propName="prefix" label="Prefix" col1={4} col2={7} />
            </Row>
            <Row className="mt-3">
              {this.props.taskData.sampleID ? (
                <InputField
                  propName="run_number"
                  disabled
                  label="Run number"
                  col1="4"
                  col2="7"
                />
              ) : null}
            </Row>
          </Form>
        </Modal.Body>

        {this.props.taskData.state ? (
          ''
        ) : (
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
        )}
      </DraggableModal>
    );
  }
}

const WorkflowForm = reduxForm({
  form: 'workflow',
  validate,
})(Workflow);

const selector = formValueSelector('workflow');

export default connect((state) => {
  const subdir = selector(state, 'subdir');
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';
  let position = state.taskForm.pointID === '' ? 'PX' : state.taskForm.pointID;
  if (typeof position === 'object') {
    const vals = Object.values(position).sort();
    position = `[${vals}]`;
  }

  let fname = '';

  if (state.taskForm.taskData.sampleID) {
    fname = state.taskForm.taskData.parameters.fileName;
  } else {
    const prefix = selector(state, 'prefix');
    fname = `${prefix}_[RUN#]_[IMG#]`;
  }

  const limits = {};

  return {
    path: `${state.login.rootPath}/${subdir}`,
    filename: fname,
    wfname: state.taskForm.taskData.parameters.wfname,
    acqParametersLimits: limits,
    beamline: state.beamline,
    suffix: fileSuffix,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: state.taskForm.taskData.sampleID
        ? state.taskForm.taskData.parameters.resolution
        : state.beamline.hardwareObjects.resolution.value,
      energy: state.taskForm.taskData.sampleID
        ? state.taskForm.taskData.parameters.energy
        : state.beamline.hardwareObjects.energy.value,
      transmission: state.taskForm.taskData.sampleID
        ? state.taskForm.taskData.parameters.transmission
        : state.beamline.hardwareObjects.transmission.value,
    },
  };
})(WorkflowForm);
