import React from 'react';
import { Button, ButtonToolbar, Col, Form, Modal, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { formValueSelector, reduxForm } from 'redux-form';

import { SPACE_GROUPS } from '../../constants';
import { DraggableModal } from '../DraggableModal';
import asyncValidate from './asyncValidate';
import {
  CheckboxField,
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

class Characterisation extends React.Component {
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
    const parameters = {
      ...params,
      type: 'Characterisation',
      label: 'Characterisation',
      shape: this.props.pointID,
      helical: false,
    };

    const stringFields = [
      'centringMethod',
      'detector_mode',
      'account_rad_damage',
      'opt_sad',
      'space_group',
      'strategy_complexity',
      'strategy_program',
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

  render() {
    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Characterisation</Modal.Title>
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
                <Col xs={4}>
                  <InputField
                    propName="run_number"
                    disabled
                    label="Run number"
                    col1="4"
                    col2="8"
                  />
                </Col>
              ) : null}
            </Row>
          </Form>
          <FieldsHeader title="Reference acquisition" />
          <Form>
            <FieldsRow>
              <SelectField
                col1="6"
                col2="4"
                propName="num_images"
                label="Number of images"
                list={[1, 2, 4]}
              />
              <InputField
                propName="transmission"
                type="number"
                label="Transmission"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="exp_time"
                type="number"
                label="Exposure time (s)"
              />
              <InputField
                propName="resolution"
                type="number"
                label="Resolution (Å)"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="osc_range"
                type="number"
                label="Oscillation range"
              />
              <InputField
                disabled={this.props.beamline.hardwareObjects.energy.readonly}
                propName="energy"
                type="number"
                label="Energy"
              />
            </FieldsRow>
            <FieldsRow>
              <InputField
                propName="osc_start"
                type="number"
                label="Oscillation start"
              />
            </FieldsRow>
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
                <InputField propName="overlap" label="Overlap" />
              </FieldsRow>
            </CollapsableRows>
          </Form>
          <FieldsHeader title="Characterisation" />
          <Form>
            <FieldsRow>
              <CheckboxField
                propName="account_rad_damage"
                label="Account for radiation damage"
              />
              <CheckboxField propName="opt_sad" label="Optimised SAD" />
            </FieldsRow>
            <FieldsRow>
              <SelectField
                col1="6"
                col2="4"
                propName="strategy_complexity"
                label="Strategy complexity"
                list={['SINGLE', 'FEW', 'MANY']}
              />
            </FieldsRow>
            <FieldsRow>
              <SelectField
                col1="6"
                col2="4"
                propName="strategy_program"
                label="Strategy"
                list={['Optimal', 'Fast', 'No strategy']}
              />
            </FieldsRow>
          </Form>
          <FieldsHeader title="Crystal" />
          <CollapsableRows>
            <Form>
              <FieldsRow>
                <SelectField
                  col1="6"
                  col2="4"
                  propName="space_group"
                  label="Space group"
                  list={SPACE_GROUPS}
                />
              </FieldsRow>
              <Form.Label className="mb-2 mt-3">
                Vertical Crystal dimension:
              </Form.Label>
              <FieldsRow>
                <InputField propName="min_crystal_vdim" label="Min" />
                <InputField
                  propName="min_crystal_vphi"
                  label="&omega; at min"
                />
              </FieldsRow>
              <FieldsRow>
                <InputField propName="max_crystal_vdim" label="Max" />
                <InputField
                  propName="max_crystal_vphi"
                  label="&omega; at max"
                />
              </FieldsRow>
            </Form>
          </CollapsableRows>
          <FieldsHeader title="Radiation damage model" />
          <CollapsableRows>
            <Form>
              <FieldsRow>
                <InputField
                  col1="6"
                  col2="5"
                  propName="beta"
                  label="&beta; Å / Mgy"
                />
                <InputField
                  col1="5"
                  col2="5"
                  propName="gamma"
                  label="&gamma; 1/Mgy"
                />
                <InputField
                  col1="6"
                  col2="5"
                  propName="rad_suscept"
                  label="Sensetivity"
                />
              </FieldsRow>
            </Form>
          </CollapsableRows>
          <FieldsHeader title="Optimization parameters" />
          <CollapsableRows>
            <Form>
              <FieldsRow>
                <InputField
                  propName="aimed_i_sigma"
                  label="Aimed I/&sigma; at highest resolution"
                />
                <InputField
                  propName="aimed_completness"
                  label="Aimed completness"
                />
              </FieldsRow>
              <Row className="mb-2">
                <Col xs="6">
                  <CheckboxField
                    propName="use_permitted_rotation"
                    label="Use permitted rotaion range"
                  />
                </Col>
              </Row>
              <FieldsRow>
                <InputField
                  disabled={!this.props.use_permitted_rotation}
                  col1="6"
                  col2="4"
                  propName="permitted_phi_start"
                  label="&omega; start"
                />
                <InputField
                  disabled={!this.props.use_permitted_rotation}
                  col1="5"
                  col2="5"
                  propName="permitted_phi_end"
                  label="&omega; end"
                />
              </FieldsRow>
              <FieldsRow>
                <CheckboxField
                  propName="use_aimed_resolution"
                  label="Maximum resolution"
                />
              </FieldsRow>
              <FieldsRow>
                <CheckboxField
                  propName="use_aimed_multiplicity"
                  label="Aimed Multiplicity"
                />
              </FieldsRow>
              <Row>
                <Col xs="6">
                  <CheckboxField
                    propName="low_res_pass_strat"
                    label="Calculate low resolution pass strategy"
                  />
                </Col>
              </Row>
            </Form>
          </CollapsableRows>
          <FieldsHeader title="Routine DC" />
          <CollapsableRows>
            <Form>
              <FieldsRow>
                <CheckboxField
                  propName="use_min_dose"
                  disabled={this.props.use_min_time}
                  label="Use min dose"
                />
                <InputField
                  disabled={this.props.use_min_time}
                  col1="6"
                  col2="4"
                  propName="min_dose"
                  label="Dose limit MGy"
                />
              </FieldsRow>
              <FieldsRow>
                <CheckboxField
                  propName="use_min_time"
                  disabled={this.props.use_min_dose}
                  label="Use min time"
                />
                <InputField
                  disabled={this.props.use_min_dose}
                  col1="6"
                  col2="4"
                  propName="min_time"
                  label="Total limit (s)"
                />
              </FieldsRow>
            </Form>
          </CollapsableRows>
          <FieldsHeader title="SAD" />
          <CollapsableRows>
            <Form>
              <Row>
                <Col xs="11">
                  <CheckboxField
                    propName="auto_res"
                    disabled={this.props.opt_sad}
                    label="Resolution selected automatically, rotation interval 360 &deg;"
                  />
                </Col>
              </Row>
              <Row>
                <Col xs="11">
                  <CheckboxField
                    propName="opt_sad"
                    disabled={this.props.auto_res}
                    label="Optimal SAD for given resolution"
                  />
                </Col>
              </Row>
              <Row>
                <Col xs="8">
                  <InputField
                    disabled={!this.props.opt_sad}
                    col1="4"
                    col2="3"
                    propName="sad_res"
                    label="Resolution"
                  />
                </Col>
              </Row>
            </Form>
          </CollapsableRows>
          <FieldsHeader title="Radiation Damage" />
          <CollapsableRows>
            <Form>
              <Row>
                <Col xs="8">
                  <CheckboxField
                    propName="determine_rad_params"
                    label="Determine radiation damage parameters"
                  />
                </Col>
              </Row>
              <Row className="mb-2">
                <InputField
                  col1="6"
                  col2="2"
                  propName="burn_osc_start"
                  label="Oscillation start for burn strategy"
                />
              </Row>
              <Row>
                <InputField
                  col1="6"
                  col2="2"
                  propName="burn_osc_interval"
                  label="Oscillation interval for burn"
                />
              </Row>
            </Form>
          </CollapsableRows>
        </Modal.Body>
        {this.props.taskData.state ? (
          ''
        ) : (
          <Modal.Footer>
            <ButtonToolbar
              style={{ bottom: '0.8%', left: '1%' }}
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

const CharacterisationForm = reduxForm({
  form: 'characterisation',
  asyncValidate,
  validate,
  warn,
})(Characterisation);

const selector = formValueSelector('characterisation');

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

  // Set number of images to 1 for 2D points
  if (position.includes('2D')) {
    parameters.num_images = 1;
  }

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
    use_permitted_rotation: selector(state, 'use_permitted_rotation'),
    use_aimed_resolution: selector(state, 'use_aimed_resolution'),
    use_aimed_multiplicity: selector(state, 'use_aimed_multiplicity'),
    auto_res: selector(state, 'auto_res'),
    opt_sad: selector(state, 'opt_sad'),
    use_min_dose: selector(state, 'use_min_dose'),
    use_min_time: selector(state, 'use_min_time'),
    initialValues: {
      ...parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: toFixed(state, 'resolution'),
      energy: toFixed(state, 'energy'),
      transmission: toFixed(state, 'transmission'),
      osc_start: toFixed(state, 'diffractometer.phi', 'osc_start'),
    },
  };
})(CharacterisationForm);
