/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Button, ButtonToolbar, Form, Modal, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { formValueSelector, reduxForm } from 'redux-form';

import { DraggableModal } from '../DraggableModal';
import PeriodicTable from '../PeriodicTable/PeriodicTable';
import { FieldsHeader, InputField, StaticField, toFixed } from './fields';
import validate from './validate';

class EnergyScan extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
    this.elementSelected = this.elementSelected.bind(this);
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
      type: 'energy_scan',
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
      'element',
      'edge',
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  elementSelected(el) {
    this.props.change('element', el);
    let edge = '';

    this.props.availableElements.forEach((item) => {
      if (item.symbol === el) {
        edge = item.energy;
      }
    });

    this.props.change('edge', edge);
  }

  render() {
    const availableElements = this.props.availableElements.map(
      (item) => item.symbol,
    );

    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Energy Scan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <StaticField label="Path" data={this.props.path} />
            <StaticField label="Filename" data={this.props.filename} />
            <Row className="mt-3">
              <InputField
                propName="subdir"
                label="Subdirectory"
                col1="4"
                col2="7"
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
            <FieldsHeader title="Element" />
            <PeriodicTable
              availableElements={availableElements}
              onElementSelected={this.elementSelected}
            />
            <Row className="mt-3 d-flex">
              <InputField
                propName="element"
                label="Element"
                col1="4"
                col2="2"
              />
            </Row>
            <Row className="mb-2 mt-3 d-flex">
              <InputField propName="edge" label="Edge" col1="4" col2="2" />
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
                disabled={
                  this.props.taskData.parameters.shape === -1 ||
                  this.props.invalid
                }
                onClick={this.submitRunNow}
              >
                Run Now
              </Button>
              <Button
                className="ms-3"
                variant="outline-secondary"
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

function validateEnergyScan(values, props) {
  const errors = validate(values, props);
  const currElement = values.element;
  const isElementAvailable = props.availableElements.some(
    (item) => item.symbol === currElement,
  );
  if (!isElementAvailable) {
    errors.element = 'Please select an element from the periodic table';
  }
  return errors;
}

const EnergyScanForm = reduxForm({
  form: 'energyscan',
  validate: validateEnergyScan,
})(EnergyScan);

const selector = formValueSelector('energyscan');

export default connect((state) => {
  const subdir = selector(state, 'subdir');
  const element = selector(state, 'element');
  const edge = selector(state, 'edge');
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';
  let position = state.taskForm.pointID === '' ? 'PX' : state.taskForm.pointID;
  if (typeof position === 'object') {
    const vals = Object.values(position).sort();
    position = `[${vals}]`;
  }

  const { type } = state.taskForm.taskData;
  const { limits } = state.taskForm.defaultParameters[type.toLowerCase()];

  return {
    path: `${state.login.rootPath}/${subdir}`,
    filename: state.taskForm.taskData.parameters.fileName,
    edge,
    element,
    wfname: state.taskForm.taskData.parameters.wfname,
    acqParametersLimits: limits,
    suffix: fileSuffix,
    beamline: state.beamline,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: toFixed(state, 'resolution'),
      energy: toFixed(state, 'energy'),
      transmission: toFixed(state, 'transmission'),
      osc_start: toFixed(state, 'diffractometer.omega', 'osc_start'),
    },
  };
})(EnergyScanForm);
