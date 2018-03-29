import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { Modal, Button, Form, Row, Col, ButtonToolbar } from 'react-bootstrap';
import { DraggableModal } from '../DraggableModal';
import validate from './validate';
import { FieldsHeader,
         StaticField,
         InputField,
         CheckboxField,
         SelectField,
         FieldsRow,
         CollapsableRows } from './fields';

import { SPACE_GROUPS } from '../../constants';

class Characterisation extends React.Component {
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
      type: 'Characterisation',
      label: 'Characterisation',
      shape: this.props.pointID,
      helical: false
    };

    const stringFields = [
      'centringMethod',
      'detector_mode',
      'account_rad_damage',
      'opt_sad',
      'space_group',
      'strategy_complexity',
      'prefix',
      'subdir',
      'type',
      'shape',
      'label',
      'helical',
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  resetParameters() {
    this.props.reset();
  }

  defaultParameters() {
    this.props.resetTaskParameters();
    const type = this.props.taskData.parameters.type;
    const fieldNames = Object.keys(this.props.initialParameters[type.toLowerCase()]);
    fieldNames.forEach((field) => {
      this.props.autofill(field, this.props.initialParameters[type.toLowerCase()][field]);
    });
  }

  render() {
    return (
      <DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Characterisation</Modal.Title>
        </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <StaticField label="Path" data={this.props.path} />
              <StaticField label="Filename" data={this.props.filename} />
              <Row>
                <Col xs={12} style={{ marginTop: '10px' }}>
                  <InputField propName="subdir" label="Subdirectory" col1="4" col2="8" />
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <InputField propName="prefix" label="Prefix" col1="4" col2="6" />
                </Col>
                {this.props.taskData.sampleID ?
                  (<Col xs={4}>
                     <InputField
                       propName="run_number"
                       disabled
                       label="Run number"
                       col1="4"
                       col2="8"
                     />
                   </Col>)
                 : null}
              </Row>
            </Form>

            <FieldsHeader title="Acquisition" />
            <Form horizontal>
              <FieldsRow>
                <SelectField propName="num_images" label="Number of images" list={[1, 2, 4]} />
                <InputField propName="transmission" type="number" label="Transmission" />
              </FieldsRow>
              <FieldsRow>
                <InputField propName="exp_time" type="number" label="Exposure time (s)" />
                <InputField propName="resolution" type="number" label="Resolution (Å)" />
              </FieldsRow>
              <FieldsRow>
                <InputField propName="osc_range" type="number" label="Oscillation range" />
                <InputField propName="energy" type="number" label="Energy (keV)" />
              </FieldsRow>
              <FieldsRow>
                <InputField propName="osc_start" type="number" label="Oscillation start" />
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
                    list={['0', 'C18', 'C2']}
                  />
                  <InputField propName="overlap" label="Overlap" />
                </FieldsRow>
              </CollapsableRows>
            </Form>
            <FieldsHeader title="Characterisation" />
              <Form horizontal>
                <FieldsRow>
                  <CheckboxField
                    defaultChecked
                    propName="account_rad_damage"
                    label="Account for radiation damage"
                  />
                  <CheckboxField
                    propName="opt_sad"
                    label="Optimised SAD"
                  />
                </FieldsRow>
                <SelectField
                  col1="4" col2="3"
                  propName="strategy_complexity"
                  label="Strategy complexity"
                  list={['SINGLE', 'FEW', 'MANY']}
                />
              </Form>
            <FieldsHeader title="Crystal" />
            <CollapsableRows>
              <Form horizontal>
                <SelectField col1="3" col2="3"
                  propName="space_group"
                  label="Space group"
                  list={SPACE_GROUPS}
                />
                <FieldsRow>
                  <InputField propName="min_crystal_vdim" label="Min" />
                  <InputField propName="max_crystal_vdim" label="Max" />
                </FieldsRow>
                <FieldsRow>
                  <InputField propName="min_crystal_vphi" label="&omega; at min" />
                  <InputField propName="max_crystal_vphi" label="&omega; at max" />
                </FieldsRow>
              </Form>
            </CollapsableRows>
         </Modal.Body>
         { this.props.taskData.state ? '' :
           <Modal.Footer>
              <ButtonToolbar className="pull-left">
              <Button bsSize="xsmall" bsStyle="default"
                onClick={this.defaultParameters}
              >
              Default Parameters
              </Button>
             </ButtonToolbar>
             <ButtonToolbar className="pull-right">
               <Button bsStyle="success"
                 disabled={this.props.taskData.parameters.shape === -1 || this.props.invalid}
                 onClick={this.submitRunNow}
               >
                 Run Now
               </Button>
               <Button bsStyle="primary" disabled={this.props.invalid}
                 onClick={this.submitAddToQueue}
               >
                 {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
               </Button>
             </ButtonToolbar>
           </Modal.Footer>
         }
      </DraggableModal>);
  }
}

Characterisation = reduxForm({
  form: 'characterisation',
  validate
})(Characterisation);

const selector = formValueSelector('characterisation');

Characterisation = connect(state => {
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

  return {
    path: `${state.queue.rootPath}/${subdir}`,
    filename: fname,
    acqParametersLimits: state.taskForm.acqParametersLimits,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: (state.taskForm.sampleIds.constructor !== Array ?
        state.taskForm.taskData.parameters.resolution :
        state.beamline.attributes.resolution.value),
      energy: (state.taskForm.sampleIds.constructor !== Array ?
        state.taskForm.taskData.parameters.energy :
        state.beamline.attributes.energy.value),
      transmission: (state.taskForm.sampleIds.constructor !== Array ?
        state.taskForm.taskData.parameters.transmission :
        state.beamline.attributes.transmission.value)
    }
  };
})(Characterisation);

export default Characterisation;
