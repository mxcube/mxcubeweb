/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Button, ButtonToolbar, Col, Form, Modal, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { change, formValueSelector, reduxForm } from 'redux-form';

import { estimateDoseRate } from '../../actions/taskForm';
import { SPACE_GROUPS } from '../../constants';
import { DraggableModal } from '../DraggableModal';
import TooltipTrigger from '../TooltipTrigger';
import asyncValidate from './asyncValidate';
import doseStyles from './DoseEstimation/DoseEstimate.module.css';
import { computeLimit, DoseLimitInput } from './DoseEstimation/DoseLimitInput';
import {
  CollapsableRows,
  FieldsHeader,
  FieldsRow,
  InputField,
  resetLastUsedParameters,
  saveToLastUsedParameters,
  SelectField,
  StaticField,
  toFixed,
} from './fields';
import validate from './validate';
import warn from './warning';

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
      'detector_roi_mode',
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
                disabled={
                  this.props.beamline.hardwareObjects.transmission.readonly
                }
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
            {this.props.taskResult.energyScan.length > 0 && (
              <FieldsRow>
                <SelectField
                  col1="6"
                  col2="4"
                  propName="energy"
                  label="Energy scan result"
                  list={energyList}
                />
              </FieldsRow>
            )}
            {this.props.canEstimateDose && (
              <FieldsRow>
                <Form.Group>
                  <Row>
                    <Form.Label column sm={6}>
                      Estimated dose (MGy)
                    </Form.Label>
                    <Form.Label column sm={5}>
                      {Number.isFinite(this.props.doseMgy) && (
                        <span
                          className={
                            this.props.doseMgy > this.props.doseLimit
                              ? doseStyles.over
                              : doseStyles.under
                          }
                        >
                          {this.props.doseMgy.toFixed(2)}
                        </span>
                      )}
                      {this.props.doseRate?.msg && (
                        <TooltipTrigger
                          id="dose-estimate-error-tooltip"
                          tooltipContent={this.props.doseRate.msg}
                          inModal
                        >
                          <span className={doseStyles.unavailable}>N/A</span>
                        </TooltipTrigger>
                      )}
                      {!Number.isFinite(this.props.doseMgy) &&
                        !this.props.doseRate?.msg && (
                          <span className={doseStyles.unavailable}>N/A</span>
                        )}
                    </Form.Label>
                  </Row>
                </Form.Group>
                <DoseLimitInput
                  goals={this.props.goals}
                  resolution={this.props.resolution}
                  value={this.props.doseLimit || Number.POSITIVE_INFINITY}
                  currentGoalId={this.props.currentGoalId}
                  onLimitChange={(limit) => {
                    this.props.change('dose_limit', limit);
                  }}
                  onGoalChange={(goal) =>
                    this.props.change('exp_goal', goal ?? null)
                  }
                />
              </FieldsRow>
            )}
            <CollapsableRows>
              <FieldsRow>
                <InputField propName="kappa" type="number" label="Kappa" />
                <InputField propName="kappa_phi" type="number" label="Phi" />
              </FieldsRow>
              {this.props.detector_mode_list.length > 0 && (
                <FieldsRow>
                  <SelectField
                    propName="detector_roi_mode"
                    label="Detector mode"
                    list={this.props.detector_mode_list}
                  />
                </FieldsRow>
              )}
            </CollapsableRows>
          </Form>

          {!this.props.initialValues.disable_processing && (
            <div>
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
            </div>
          )}
        </Modal.Body>

        {this.props.taskData.state ? '' : this.showFooter()}
      </DraggableModal>
    );
  }
}

const DataCollectionForm = reduxForm({
  form: 'datacollection',
  validate,
  asyncValidate,
  warn,
  shouldWarn: ({ values, nextProps, props, initialRender, structure }) => {
    // Default behaviour + recomputing warnings on estimate changes.
    if (initialRender) {
      return true;
    }
    if (!structure.deepEqual(values, nextProps.values)) {
      return true;
    }
    return props.doseRate !== nextProps.doseRate;
  },
  onChange: (values, dispatch, props, previousValues) => {
    // when using dose estimation, changes to form fields
    // may trigger a need to reestimate the dose rate.
    // Dose and max images are derived from the rate locally.
    // this also handles recomputing the dose limit.
    if (!props.canEstimateDose) {
      return;
    }
    if (
      values.energy !== previousValues.energy ||
      values.transmission !== previousValues.transmission
    ) {
      dispatch(
        estimateDoseRate({
          energy_kev: Number.parseFloat(values.energy),
          transmission_pct: Number.parseFloat(values.transmission),
        }),
      );
    }

    const currentGoal = props.goals?.[values.exp_goal];
    if (
      values.resolution !== previousValues.resolution &&
      currentGoal?.type === 'resolution_dependent'
    ) {
      dispatch(
        change(
          'datacollection',
          'dose_limit',
          computeLimit(currentGoal, values.resolution),
        ),
      );
    }
  },
})(DataCollection);

const selector = formValueSelector('datacollection');

export default connect((state) => {
  const { doseRate } = state.taskForm;

  const doseEstimatorHO = state.beamline.hardwareObjects?.dose_estimator;
  const subdir = selector(state, 'subdir');
  const canEstimateDose = !!doseEstimatorHO;

  const goals = doseEstimatorHO?.attributes?.experimental_goals || {};

  const resolution = Number.parseFloat(toFixed(state, 'resolution'));

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
  const { limits, acq_parameters } =
    state.taskForm.defaultParameters[type.toLowerCase()];
  const { parameters } = state.taskForm.taskData;

  const doseLimit = selector(state, 'dose_limit');
  const currentGoalId = selector(state, 'exp_goal');

  // Dose grows linearly with exposure, so it is derived from the rate here.
  const doseMgyPerImage =
    doseRate?.mgy_per_s === undefined
      ? null
      : doseRate.mgy_per_s * Number.parseFloat(selector(state, 'exp_time'));
  const doseMgy =
    doseMgyPerImage === null
      ? null
      : doseMgyPerImage * Number.parseInt(selector(state, 'num_images'), 10);
  const maxImages =
    doseMgyPerImage > 0 && doseLimit
      ? Math.floor(Number.parseFloat(doseLimit) / doseMgyPerImage)
      : null;

  if (Number.parseFloat(parameters.osc_range) === 0) {
    parameters.osc_range =
      state.taskForm.defaultParameters[
        type.toLowerCase()
      ].acq_parameters.osc_range;
  }

  const currentSampleId =
    state.taskForm.sampleIds.length === 1 ? state.taskForm.sampleIds[0] : null;

  const {
    cellA,
    cellAlpha,
    cellB,
    cellBeta,
    cellC,
    cellGamma,
    crystalSpaceGroup,
  } = state.sampleGrid.sampleList[currentSampleId] ?? {};

  return {
    path: `${state.login.rootPath}/${subdir}`,
    filename: fname,
    acqParametersLimits: limits,
    beamline: state.beamline,
    canEstimateDose,
    goals,
    resolution,
    doseRate,
    doseMgy,
    maxImages,
    doseLimit,
    currentGoalId,
    detector_mode_list: acq_parameters.detector_mode_list,
    components: state.uiproperties.sample_view_motors.components,
    initialValues: {
      ...parameters,
      beam_size: state.sampleview.currentAperture,
      dose_limit: Object.values(goals)[0]
        ? computeLimit(Object.values(goals)[0], resolution)
        : undefined,
      exp_goal: Object.keys(goals)[0],
      resolution: toFixed(state, 'resolution'),
      energy: toFixed(state, 'energy'),
      transmission: toFixed(state, 'transmission'),
      osc_start: toFixed(state, 'diffractometer.omega', 'osc_start'),
      cellA,
      cellAlpha,
      cellB,
      cellBeta,
      cellC,
      cellGamma,
      space_group: crystalSpaceGroup,
    },
  };
})(DataCollectionForm);
