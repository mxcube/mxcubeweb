import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import {
  Modal, Button, Form, Row, Col, ButtonToolbar
} from 'react-bootstrap';
import { DraggableModal } from '../DraggableModal';
import validate from './validate';
import warn from './warning';

import {
  FieldsHeader,
  StaticField,
  InputField,
  CheckboxField,
  SelectField,
  FieldsRow,
  CollapsableRows
} from './fields';

class Helical extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
    this.resetParameters = this.resetParameters.bind(this);
    this.defaultParameters = this.defaultParameters.bind(this);
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
      type: 'DataCollection',
      label: 'Helical',
      helical: true,
      mesh: false,
      shape: this.props.pointID,
    };

    // Form gives us all parameter values in strings so we need to transform numbers back
    const stringFields = [
      'shutterless',
      'inverse_beam',
      'centringMethod',
      'detector_mode',
      'space_group',
      'prefix',
      'subdir',
      'type',
      'label',
      'helical',
      'shape',
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  resetParameters(form) {
    this.props.reset(form.toLowerCase());
  }

  defaultParameters() {
    const { type } = this.props.taskData;
    this.props.resetTaskParameters();
    this.resetParameters(type);
    const fieldNames = Object.keys(this.props.initialParameters[type.toLowerCase()]);
    fieldNames.forEach((field) => {
      this.props.autofill(type.toLowerCase(), field, this.props.initialParameters[type.toLowerCase()][field]);
    });
  }


  render() {
    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Helical Data Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FieldsHeader title="Data location" />
          <Form>
            <StaticField label="Path" data={this.props.path} />
            <Row className='mt-3'>
              <InputField propName="subdir" label="Subdirectory" col1="4" col2="7" />
            </Row>
            <Row className='mt-3'>
              <InputField propName="prefix" label="Prefix" col1="4" col2="7" />
            </Row>
            <Row className='mt-3 mb-3'>
              {this.props.taskData.sampleID
                ? (
                  <InputField
                    propName="run_number"
                    disabled
                    label="Run number"
                    col1="4"
                    col2="7"
                  />
                )
                : null}
            </Row>
            <StaticField label="Filename" data={this.props.filename} />
          </Form>

          <FieldsHeader title="Acquisition" />
          <Form>
            <FieldsRow>
              <InputField propName="osc_range" type="number" label="Oscillation range" />
              <InputField propName="first_image" type="number" label="First image" />
            </FieldsRow>
            <FieldsRow>
              <InputField propName="osc_start" type="number" label="Oscillation start" />
              <InputField propName="num_images" type="number" label="Number of images" />
            </FieldsRow>
            <FieldsRow>
              <InputField propName="exp_time" type="number" label="Exposure time (s)" />
              <InputField propName="transmission" type="number" label="Transmission" />
            </FieldsRow>
            <FieldsRow>
              <InputField propName="energy" type="number" label="Energy" />
              <InputField propName="resolution" type="number" label="Resolution" />
            </FieldsRow>
            <CollapsableRows>
              <FieldsRow>
                <InputField propName="kappa" type="number" label="Kappa" />
                <InputField propName="kappa_phi" type="number" label="Phi" />
              </FieldsRow>
              <FieldsRow>
                <SelectField
                  propName="beam_size"
                  label="Beam size"
                  list={this.props.apertureList}
                />
                <SelectField
                  propName="detector_mode"
                  label="Detector mode"
                  list={['0', 'C18', 'C2']}
                />
              </FieldsRow>
              <FieldsRow>
                <CheckboxField propName="shutterless" label="Shutterless" />
                <CheckboxField propName="inverse_beam" label="Inverse beam" />
              </FieldsRow>
            </CollapsableRows>
          </Form>

          <FieldsHeader title="Processing" />
        </Modal.Body>
        {this.props.taskData.state ? ''
          : (
            <Modal.Footer>
              <ButtonToolbar className="pull-left">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={this.defaultParameters}
                >
                  Default Parameters
                </Button>
              </ButtonToolbar>
              <ButtonToolbar className="pull-right">
                <Button
                  variant="success"
                  disabled={this.props.taskData.parameters.shape === -1 || this.props.invalid}
                  onClick={this.submitRunNow}
                >
                  Run Now
                </Button>
                <Button
                  className='ms-3'
                  variant="primary"
                  disabled={this.props.invalid}
                  onClick={this.submitAddToQueue}
                >
                  {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
                </Button>
              </ButtonToolbar>
            </Modal.Footer>
          )
        }
      </DraggableModal>
    );
  }
}

Helical = reduxForm({
  form: 'helical',
  validate,
  warn
})(Helical);

const selector = formValueSelector('helical');

Helical = connect((state) => {
  const subdir = selector(state, 'subdir');
  let fname = '';

  if (state.taskForm.sampleID) {
    fname = state.taskForm.taskData.parameters.fileName;
  } else {
    const prefix = selector(state, 'prefix');
    fname = `${prefix}_[RUN#]_[IMG#]`;
  }

  const { type } = state.taskForm.taskData;
  const {limits} = state.taskForm.defaultParameters[type.toLowerCase()];

  return {
    path: `${state.login.rootPath}/${subdir}`,
    filename: fname,
    acqParametersLimits: limits,
    beamline: state.beamline,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: (state.taskForm.sampleIds.constructor !== Array
        ? state.taskForm.taskData.parameters.resolution
        : state.beamline.hardwareObjects.resolution.value),
      energy: (state.taskForm.sampleIds.constructor !== Array
        ? state.taskForm.taskData.parameters.energy
        : state.beamline.hardwareObjects.energy.value),
      transmission: (state.taskForm.sampleIds.constructor !== Array
        ? state.taskForm.taskData.parameters.transmission
        : state.beamline.hardwareObjects.transmission.value),
      osc_start: (state.taskForm.sampleIds.constructor !== Array
        ? state.taskForm.taskData.parameters.osc_start
        : state.beamline.hardwareObjects["diffractometer.phi"].value)
    }
  };
})(Helical);

export default Helical;
