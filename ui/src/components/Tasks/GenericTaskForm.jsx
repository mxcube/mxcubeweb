/* eslint-disable react/destructuring-assignment */
import './style.css';

import JSForm from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import React from 'react';
import { Button, ButtonToolbar, Col, Form, Modal, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { formValueSelector, reduxForm } from 'redux-form';

import { sendUpdateDependentFields } from '../../api/queue';
import { DraggableModal } from '../DraggableModal';
import CustomFieldErrorTemplate from './CustomFieldErrorTemplate';
import CustomFieldTemplate from './CustomFieldTemplate';
import CustomObjectFieldTemplate from './CustomObjectFieldTemplate';
import {
  InputField,
  resetLastUsedParameters,
  saveToLastUsedParameters,
  StaticField,
  toFixed,
} from './fields';
import validate from './validate';
import warn from './warning';

class GenericTaskForm extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.showFooter = this.showFooter.bind(this);
    this.showDCFooter = this.showDCFooter.bind(this);
    this.showDPFooter = this.showDPFooter.bind(this);
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
    this.defaultParameters = this.defaultParameters.bind(this);
    this.jsformData = {};
  }

  submitAddToQueue() {
    this.props.handleSubmit(this.addToQueue.bind(this, false))();
  }

  submitRunNow() {
    this.props.handleSubmit(this.addToQueue.bind(this, true))();
  }

  get jsFormStorageKey() {
    return `current${this.props.taskData.type}Parameters`;
  }

  clearCurrentJSFormParameters() {
    localStorage.removeItem(this.jsFormStorageKey);
  }

  saveCurrentJSFormParameters(formData) {
    localStorage.setItem(this.jsFormStorageKey, JSON.stringify(formData));
  }

  addToQueue(runNow, params) {
    const parameters = {
      ...params,
      ...this.jsformData,
      label: params.name,
      shape: this.props.pointID,
      selection: this.props.taskData.parameters.selection,
      experiment_name: params.experimentName,
    };

    // Form gives us all parameter values in strings so we need to transform numbers back
    const stringFields = [
      'shutterless',
      'inverse_beam',
      'centringMethod',
      'detector_roi_mode',
      'space_group',
      'prefix',
      'subdir',
      'type',
      'shape',
      'label',
      'helical',
      'selection',
      'experiment_name',
      'chip_type',
    ];

    saveToLastUsedParameters(this.props.taskData.type, parameters, [
      'selection',
    ]);
    this.clearCurrentJSFormParameters();
    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  defaultParameters() {
    this.clearCurrentJSFormParameters();
    resetLastUsedParameters(this);
  }

  showDCFooter() {
    return (
      <Modal.Footer>
        <div className="input-group-btn d-flex">
          <ButtonToolbar
            style={{ bottom: '15px', left: '10px' }}
            className="position-absolute"
          >
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={this.defaultParameters}
            >
              Default Parameters
            </Button>
          </ButtonToolbar>
          <ButtonToolbar>
            <Button
              className="me-3 ms-3"
              size="sm"
              variant="success"
              disabled={this.props.invalid}
              onClick={this.submitRunNow}
            >
              Run Now
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={this.props.invalid}
              onClick={this.submitAddToQueue}
            >
              {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
            </Button>
          </ButtonToolbar>
        </div>
      </Modal.Footer>
    );
  }

  showDPFooter() {
    return (
      <Modal.Footer>
        <ButtonToolbar className="float-end">
          <Button
            className="me-3"
            variant="success"
            disabled={
              this.props.taskData.parameters.shape === -1 || this.props.invalid
            }
            onClick={this.submitRunNow}
          >
            Run Now
          </Button>
          <Button
            variant="primary"
            disabled={this.props.invalid}
            onClick={this.submitAddToQueue}
          >
            Add Collection Plan to Queue
          </Button>
        </ButtonToolbar>
      </Modal.Footer>
    );
  }

  showFooter() {
    const { isDiffractionPlan } = this.props.taskData;
    let foot = '';

    if (isDiffractionPlan) {
      foot = this.showDPFooter();
    } else {
      foot = this.showDCFooter();
    }
    return foot;
  }

  setConstraintsFromDefualts(schema) {
    const s = { ...schema };

    for (const key in this.props.initialValues) {
      if (s.properties[key]) {
        s.properties[key].default = this.props.initialValues[key];
      }
    }

    const currentFormData = JSON.parse(
      localStorage.getItem(this.jsFormStorageKey),
    );

    if (currentFormData) {
      for (const key in currentFormData) {
        if (s.properties[key]) {
          s.properties[key].default = currentFormData[key];
        }
      }
    }

    for (const key in this.props.taskData.Arraylimits) {
      if (s.properties[key]) {
        s.properties[key].exclusiveMinimum = this.props.taskData.limits[key][0];
        s.properties[key].exclusiveMaximum = this.props.taskData.limits[key][1];
      }
    }

    return s;
  }

  updateFromRemoteValidation(formData) {
    // eslint-disable-next-line promise/prefer-await-to-then, promise/catch-or-return
    sendUpdateDependentFields(this.props.taskData.type, formData).then((_d) => {
      const data = JSON.parse(_d);

      // eslint-disable-next-line guard-for-in
      for (const fieldName in data) {
        const el = document.querySelector(`#root_${fieldName}`);
        if (el !== null) {
          el.value = data[fieldName];
        }
      }
    });
  }

  render() {
    const uiSchema = JSON.parse(this.props.uiSchema);
    const schema = this.setConstraintsFromDefualts(
      this.props.schema.user_collection_parameters,
    );

    return (
      <DraggableModal
        show={this.props.show}
        onHide={() => {
          this.clearCurrentJSFormParameters();
          this.props.hide();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{this.props.taskData.parameters.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <StaticField label="Path" data={this.props.path} />
            <StaticField label="Filename" data={this.props.filename} />
            <Row className="mb-2">
              <Col xs={12} style={{ marginTop: '10px' }}>
                <InputField
                  disabled
                  propName="subdir"
                  label="Sample name"
                  col1="2"
                  col2="8"
                />
              </Col>
            </Row>
            <Row>
              {this.props.useExperimentName ? (
                <Col xs={6}>
                  <InputField
                    propName="experimentName"
                    label="Experiment Name"
                    col1="4"
                    col2="6"
                  />
                </Col>
              ) : null}
              <Col xs={12}>
                <InputField
                  propName="prefix"
                  label="Prefix"
                  col1="2"
                  col2="8"
                />
              </Col>
              {this.props.taskData.sampleID ? (
                <Col xs={8}>
                  <InputField
                    propName="run_number"
                    disabled
                    label="Run number"
                    col1="4"
                    col2="3"
                  />
                </Col>
              ) : null}
            </Row>
          </Form>

          <div className="json-schema-form-container">
            <JSForm
              liveValidate
              validator={validator}
              schema={schema}
              uiSchema={uiSchema}
              showErrorList={false}
              onChange={({ formData }) => {
                this.updateFromRemoteValidation(formData);
                this.saveCurrentJSFormParameters(formData);
                this.jsformData = formData;
              }}
              templates={{
                ObjectFieldTemplate: CustomObjectFieldTemplate,
                FieldTemplate: CustomFieldTemplate,
                FieldErrorTemplate: CustomFieldErrorTemplate,
              }}
            />
          </div>
        </Modal.Body>

        {this.props.taskData.state ? '' : this.showFooter()}
      </DraggableModal>
    );
  }
}

const GenericTaskFormForm = reduxForm({
  form: 'GenericTaskForm',
  validate,
  warn,
})(GenericTaskForm);

const selector = formValueSelector('GenericTaskForm');

export default connect((state) => {
  const subdir = selector(state, 'subdir');
  const experimentNameSelector = selector(state, 'experimentName');
  let position = state.taskForm.pointID === '' ? 'PX' : state.taskForm.pointID;
  if (typeof position === 'object') {
    const vals = Object.values(position).sort();
    position = `[${vals}]`;
  }

  let fname = '';

  if (state.taskForm.sampleID) {
    fname = state.taskForm.taskData.parameters.fileName;
  } else {
    const prefix = selector(state, 'prefix');
    fname = `${prefix}_[RUN#]_[IMG#]`;
  }

  const { type } = state.taskForm.taskData;
  const { limits } = state.taskForm.defaultParameters[type];
  const { schema } = state.taskForm.defaultParameters[type];
  const uiSchema = state.taskForm.defaultParameters[type].ui_schema;
  const useExperimentName =
    state.taskForm.taskData.parameters.use_experiment_name;

  let path = `${state.login.rootPath}/${subdir}${experimentNameSelector}/[RUN#]`;

  if (!useExperimentName) {
    path = `${state.login.rootPath}/${subdir}/[RUN#]`;
  }

  return {
    path,
    filename: fname,
    experimentName: experimentNameSelector,
    subdir,
    acqParametersLimits: limits,
    useExperimentName,
    schema,
    uiSchema,
    beamline: state.beamline,
    components: state.uiproperties.sample_view_motors.components,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      type,
      beam_size: state.sampleview.currentAperture,
      resolution: toFixed(state, 'resolution'),
      energy: toFixed(state, 'energy'),
      transmission: toFixed(state, 'transmission'),
      osc_start: toFixed(state, 'diffractometer.phi', 'osc_start'),
    },
  };
})(GenericTaskFormForm);
