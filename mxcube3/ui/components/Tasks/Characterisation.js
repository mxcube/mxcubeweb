import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import validate from './validate';
import { FieldsHeader,
         StaticField,
         InputField,
         CheckboxField,
         SelectField,
         FieldsRow,
         CollapsableRows } from './fields';

class Characterisation extends React.Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
  }

  handleSubmit() {
    // took me 1 day to find I had to *make a call* at the end
    this.props.handleSubmit(this.addToQueue)();
    // -------------------------------------^^
  }

  addToQueue(params) {
    const parameters = {
      ...params,
      type: 'Characterisation',
      label: 'Characterisation',
      point: this.props.pointID,
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
      'point',
      'label',
      'helical'
    ];

    this.props.addTask(parameters, stringFields, false);
    this.props.hide();
  }

  render() {
    return (
      <Modal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Characterisation</Modal.Title>
        </Modal.Header>
          <Modal.Body>
            <FieldsHeader title="Data location" />
            <Form horizontal>
              <StaticField label="Path" data={this.props.rootPath} />
              <Row>
                <Col xs={6}>
                  <InputField propName="subdir" label="Subdirectory" />
                </Col>
              </Row>
              <StaticField label="Filename" data="ref-xxx.yyy.zzz" />
              <FieldsRow>
                <InputField propName="prefix" label="Prefix" />
                <InputField propName="run_number" label="Run number" />
              </FieldsRow>
            </Form>

            <FieldsHeader title="Acquisition" />
            <Form horizontal>
              <FieldsRow>
                <SelectField propName="num_images" label="Number of images" list={[1, 2, 4]} />
                <InputField propName="transmission" label="Transmission" />
              </FieldsRow>
                <InputField propName="exp_time" label="Exposure time (ms)" />
                <SelectField
                  propName="beam_size"
                  label="Beam size"
                  list={this.props.apertureList}
                />
              <FieldsRow>
                <InputField propName="osc_range" label="Oscillation range" />
                <InputField propName="resolution" label="Resolution (Å)" />
              </FieldsRow>
              <FieldsRow>
                <InputField propName="osc_start" label="Oscillation start" />
                <InputField propName="energy" label="Energy (keV)" />
              </FieldsRow>
              <FieldsRow>
                <InputField propName="energy" label="Energy" />
              </FieldsRow>
              <CollapsableRows>
                <FieldsRow>
                  <InputField propName="kappa" label="Kappa" />
                  <InputField propName="kappa_phi" label="Phi" />
                </FieldsRow>
                <FieldsRow>
                  <SelectField
                    propName="detector_mode"
                    label="Detector mode"
                    list={['0', 'C18', 'C2']}
                  />
                </FieldsRow>
              </CollapsableRows>
            </Form>

            <FieldsHeader title="Characterisation" />
            <CollapsableRows>
              <Form horizontal>
                <FieldsRow>
                  <SelectField
                    propName="strategy_complexity"
                    label="Strategy complexity"
                    list={['Single subwedge', 'Multiple subwedge']}
                  />
                  <CheckboxField
                    propName="account_rad_damage"
                    label="Account for radiation damage"
                  />
                </FieldsRow>
                <FieldsRow>
                  <CheckboxField propName="opt_sad" label="Optimised SAD" />
                </FieldsRow>
              </Form>
            </CollapsableRows>

            <FieldsHeader title="Crystal" />
            <CollapsableRows>
              <Form horizontal>
                <FieldsRow>
                  <SelectField propName="space_group" label="Space group" list={['P1', 'P211']} />
                </FieldsRow>
                <FieldsRow>
                  <InputField propName="min_crystal_vdim" label="Min" />
                  <InputField propName="max_crystal_vdim" label="Max" />
                  <InputField propName="min_crystal_vphi" label="&omega; at min" />
                  <InputField propName="max_crystal_vphi" label="&omega; at max" />
                </FieldsRow>
              </Form>
            </CollapsableRows>
         </Modal.Body>
         { this.props.taskData.state ? '' :
           <Modal.Footer>
             <Button bsStyle="primary" disabled={this.props.invalid} onClick={this.handleSubmit}>
               {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
             </Button>
           </Modal.Footer>
         }
      </Modal>);
  }
}

Characterisation = reduxForm({
  form: 'characterisation',
  validate
})(Characterisation);

Characterisation = connect(state => {
  return {
    motorLimits: state.beamline.motorsLimits,
    acqParametersLimits: state.taskForm.acqParametersLimits,
    initialValues: {
        ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture
    }
  };
}
)(Characterisation);

export default Characterisation;

