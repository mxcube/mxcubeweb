/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { Modal, Button, Form, Row, Col, ButtonToolbar } from 'react-bootstrap';
import { DraggableModal } from '../DraggableModal';
import validate from './validate';
import warn from './warning';
import JSForm from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import classNames from 'classnames';
import './style.css';

import { sendUpdateDependentFields } from '../../actions/queue';

import {
  FieldsHeader,
  StaticField,
  InputField,
  saveToLastUsedParameters,
  resetLastUsedParameters,
} from './fields';

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
      'detector_mode',
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

    saveToLastUsedParameters(this.props.taskData.type, params);
    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  defaultParameters() {
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
            Run Nowjson-schema-form-group-div
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

    for (const key in this.props.taskData.Arraylimits) {
      if (s.properties[key]) {
        s.properties[key].exclusiveMinimum = this.props.taskData.limits[key][0];
        s.properties[key].exclusiveMaximum = this.props.taskData.limits[key][1];
      }
    }

    return s;
  }

  customFieldTemplate(props) {
    const {
      id,
      classNames,
      label,
      help,
      required,
      rawDescription,
      description,
      errors,
      children,
    } = props;
    return (
      <div className={classNames}>
        {id !== 'root' ? (
          <label htmlFor={id}>
            {label}
            {required ? '*' : null}
            {rawDescription ? ` (${rawDescription})` : null}
          </label>
        ) : null}
        {description}
        {children}
        {errors}
        {help}
      </div>
    );
  }

  columnsObjectFieldTemplate({ properties, description }) {
    return (
      <div>
        <div className="row">
          {properties.map((prop) => {
            const { uiSchema } = prop.content.props;
            const className = classNames(
              'column',
              uiSchema['ui:column'] || 'col-6 json-schema-form-group-div',
            );
            return (
              <div key={prop.content.key} className={className}>
                {prop.content}
              </div>
            );
          })}
        </div>
        {description}
      </div>
    );
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
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.taskData.name}</Modal.Title>
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

          <FieldsHeader title="Acquisition" />
          <div className="json-schema-form-container">
            <JSForm
              liveValidate
              validator={validator}
              schema={schema}
              uiSchema={uiSchema}
              onChange={({ formData }) => {
                this.updateFromRemoteValidation(formData);
                this.jsformData = formData;
              }}
              ObjectFieldTemplate={this.columnsObjectFieldTemplate}
              FieldTemplate={this.customFieldTemplate}
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
    initialValues: {
      ...state.taskForm.taskData.parameters,
      type,
      beam_size: state.sampleview.currentAperture,
      resolution:
        state.taskForm.sampleIds.constructor !== Array
          ? state.taskForm.taskData.parameters.resolution
          : state.beamline.hardwareObjects.resolution.value,
      energy:
        state.taskForm.sampleIds.constructor !== Array
          ? state.taskForm.taskData.parameters.energy
          : state.beamline.hardwareObjects.energy.value,
      transmission:
        state.taskForm.sampleIds.constructor !== Array
          ? state.taskForm.taskData.parameters.transmission
          : state.beamline.hardwareObjects.transmission.value,
      osc_start: state.taskForm.taskData.parameters.osc_start,
    },
  };
})(GenericTaskFormForm);
