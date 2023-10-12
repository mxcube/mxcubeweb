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
  SelectField,
  FieldsRow,
  CollapsableRows,
  toFixed,
  saveToLastUsedParameters,
  resetLastUsedParameters,
} from './fields';

import { SPACE_GROUPS } from '../../constants';

class DataCollection extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.showFooter = this.showFooter.bind(this);
    this.showDCFooter = this.showDCFooter.bind(this);
    this.showDPFooter = this.showDPFooter.bind(this);
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
    const parameters = {
      ...params,
      type: 'DataCollection',
      label: 'Data Collection',
      helical: false,
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
      'shape',
      'label',
      'helical',
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
              disabled={
                this.props.taskData.parameters.shape === -1 ||
                this.props.invalid
              }
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
            Add Diffraction Plan to Queue
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

  render() {
    const energyScanResult =
      this.props.taskResult.energyScan.length > 0
        ? this.props.taskResult.energyScan[
            this.props.taskResult.energyScan.length - 1
          ]
        : [];

    const energyList = [];

    Object.values(energyScanResult).forEach((result) => {
      energyList.push(result);
    });

    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Standard Data Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <StaticField label="Path" data={this.props.path} />
            <StaticField label="Filename" data={this.props.filename} />
            <Row className="mb-2">
              <Col xs={12} style={{ marginTop: '10px' }}>
                <InputField
                  propName="subdir"
                  label="Subdirectory"
                  col1="2"
                  col2="8"
                />
              </Col>
            </Row>
            <Row>
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
          <Form>
            <FieldsRow>
              <InputField
                propName="osc_range"
                type="number"
                label="Oscillation range"
              />
              <InputField
                propName="first_image"
                type="number"
                label="First image"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="osc_start"
                type="number"
                label="Oscillation start"
              />
              <InputField
                propName="num_images"
                type="number"
                label="Number of images"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="exp_time"
                type="number"
                label="Exposure time (s)"
              />
              <InputField
                propName="transmission"
                type="number"
                label="Transmission"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                disabled={this.props.beamline.hardwareObjects.energy.readonly}
                propName="energy"
                type="number"
                label="Energy"
              />
              <InputField
                propName="resolution"
                type="number"
                label="Resolution"
              />
            </FieldsRow>
            {this.props.taskResult.energyScan.length > 0 ? (
              <FieldsRow>
                <SelectField
                  col1="6"
                  col2="4"
                  propName="energy"
                  label="Energy scan result"
                  list={energyList}
                />
              </FieldsRow>
            ) : null}
            <CollapsableRows>
              <FieldsRow>
                <InputField propName="kappa" type="number" label="Kappa" />
                <InputField propName="kappa_phi" type="number" label="Phi" />
              </FieldsRow>
              <FieldsRow>
                <SelectField
                  propName="detector_mode"
                  label="Detector mode"
                  list={['0', 'C18', 'C12', 'C2']}
                />
              </FieldsRow>
            </CollapsableRows>
          </Form>

          <FieldsHeader title="Processing" />
          <CollapsableRows>
            <Form>
              <SelectField
                col1="3"
                col2="3"
                propName="space_group"
                label="Space group"
                list={SPACE_GROUPS}
              />
              <Form.Label className="mb-2 mt-3">
                <b> Unit Cell: </b>
              </Form.Label>
              <FieldsRow>
                <InputField col1="1" col2="5" propName="cellA" label="a" />
                <InputField col1="1" col2="5" propName="cellB" label="b" />
                <InputField col1="1" col2="5" propName="cellC" label="c" />
              </FieldsRow>
              <FieldsRow>
                <InputField
                  col1="1"
                  col2="5"
                  propName="cellAlpha"
                  label="&alpha;"
                />
                <InputField
                  col1="1"
                  col2="5"
                  propName="cellBeta"
                  label="&beta;"
                />
                <InputField
                  col1="1"
                  col2="5"
                  propName="cellGamma"
                  label="&gamma;"
                />
              </FieldsRow>
            </Form>
          </CollapsableRows>
        </Modal.Body>

        {this.props.taskData.state ? '' : this.showFooter()}
      </DraggableModal>
    );
  }
}

const DataCollectionForm = reduxForm({
  form: 'datacollection',
  validate,
  warn,
})(DataCollection);

const selector = formValueSelector('datacollection');

export default connect((state) => {
  const subdir = selector(state, 'subdir');

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
  const { limits } = state.taskForm.defaultParameters[type.toLowerCase()];
  const { parameters } = state.taskForm.taskData;

  if (Number.parseFloat(parameters.osc_range) === 0) {
    parameters.osc_range =
      state.taskForm.defaultParameters[
        type.toLowerCase()
      ].acq_parameters.osc_range;
  }

  return {
    path: `${state.login.rootPath}/${subdir}`,
    filename: fname,
    acqParametersLimits: limits,
    beamline: state.beamline,
    initialValues: {
      ...parameters,
      beam_size: state.sampleview.currentAperture,
      resolution:
        state.taskForm.sampleIds.constructor !== Array
          ? state.taskForm.taskData.parameters.resolution
          : toFixed(state, 'resolution'),
      energy:
        state.taskForm.sampleIds.constructor !== Array
          ? state.taskForm.taskData.parameters.energy
          : toFixed(state, 'energy'),
      transmission:
        state.taskForm.sampleIds.constructor !== Array
          ? state.taskForm.taskData.parameters.transmission
          : toFixed(state, 'transmission'),
      osc_start:
        state.taskForm.sampleIds.constructor !== Array
          ? state.taskForm.taskData.parameters.osc_start
          : toFixed(state, 'diffractometer.phi'),
    },
  };
})(DataCollectionForm);
