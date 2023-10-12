/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { Modal, Button, Form, Row, Col, ButtonToolbar } from 'react-bootstrap';
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
  CollapsableRows,
  DisplayField,
  saveToLastUsedParameters,
  resetLastUsedParameters,
} from './fields';

class Mesh extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
    this.defaultParameters = this.defaultParameters.bind(this);
  }

  submitAddToQueue() {
    this.props.handleSubmit(this.addToQueue.bind(this, false))();
  }

  submitRunNow() {
    this.props.handleSubmit(this.addToQueue.bind(this, true))();
  }

  addToQueue(runNow, params) {
    let aux = params.num_images;
    if (params.cell_counting === 'zig-zag') {
      aux = params.numCols;
    } else {
      aux = params.numRows;
    }

    const parameters = {
      ...params,
      type: 'DataCollection',
      label: 'Mesh',
      mesh: true,
      helical: false,
      shape: this.props.pointID,
      num_images: aux,
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
      'point',
      'label',
      'mesh',
      'shape',
    ];

    saveToLastUsedParameters(this.props.taskData.type, params);
    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  defaultParameters() {
    resetLastUsedParameters(this);
  }

  render() {
    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Mesh Scan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FieldsHeader title="Data location" />
          <Form>
            <StaticField label="Path" data={this.props.path} />
            <Row className="mt-3">
              <InputField
                propName="subdir"
                label="Subdirectory"
                col1="4"
                col2="7"
              />
            </Row>
            <Row>
              <InputField propName="prefix" label="Prefix" col1="6" col2="7" />
            </Row>
            <Row className="mt-3 mb-3">
              {this.props.taskData.sampleID ? (
                <Col xs={4}>
                  <InputField
                    propName="run_number"
                    disabled
                    label="Run number"
                    col1="4"
                    col2="7"
                  />
                </Col>
              ) : null}
            </Row>
            <StaticField label="Filename" data={this.props.filename} />
          </Form>

          <FieldsHeader title="Acquisition" />
          <Form>
            <FieldsRow>
              <InputField
                propName="osc_range"
                type="number"
                label="Oscillation range per image"
              />
              <InputField
                propName="first_image"
                type="number"
                label="First image"
              />
            </FieldsRow>
            <FieldsRow>
              <DisplayField
                label="Oscillation start"
                value={this.props.initialValues.osc_start}
              />
              <DisplayField
                label="Total number of images"
                value={this.props.taskData.parameters.cell_count}
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="exp_time"
                type="number"
                label="Exposure time per image(s)"
              />
              <InputField
                propName="transmission"
                type="number"
                label="Transmission"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField propName="energy" type="number" label="Energy" />
              <InputField
                propName="resolution"
                type="number"
                label="Resolution"
              />
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
              </FieldsRow>
            </CollapsableRows>
          </Form>

          <FieldsHeader title="Processing" />
        </Modal.Body>
        {this.props.taskData.state ? (
          ''
        ) : (
          <Modal.Footer>
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

const MeshForm = reduxForm({
  form: 'mesh',
  validate,
  warn,
})(Mesh);

const selector = formValueSelector('mesh');

export default connect((state) => {
  const subdir = selector(state, 'subdir');

  let fname = '';

  if (state.taskForm.taskData.sampleID) {
    fname = state.taskForm.taskData.parameters.fileName;
  } else {
    const prefix = selector(state, 'prefix');
    fname = `${prefix}_[RUN#]_[IMG#]`;
  }

  const { type } = state.taskForm.taskData;
  const { limits } = state.taskForm.defaultParameters[type.toLowerCase()];

  return {
    path: `${state.login.rootPath}/${subdir}`,
    filename: fname,
    acqParametersLimits: limits,
    beamline: state.beamline,
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
      osc_start: state.beamline.hardwareObjects['diffractometer.phi'].value,
    },
  };
})(MeshForm);
