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

class DataCollection extends React.Component {
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
      type: 'DataCollection',
      label: 'Helical',
      helical: true,
      point: this.props.lines.length - 1,
      p1: this.props.pointID.p1,
      p2: this.props.pointID.p2
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
      'helical'
    ];

    this.props.addTask(parameters, stringFields, false);
    this.props.hide();
  }

  render() {
    return (<Modal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Helical Data Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FieldsHeader title="Data location" />
          <Form horizontal>
            <StaticField label="Path" data="xxx" />
            <Row>
              <Col xs={6}>
                <InputField propName="subdir" label="Subdirectory" />
              </Col>
            </Row>
            <StaticField label="Filename" data="xxx.yyy.zzz" />
            <FieldsRow>
                <InputField propName="prefix" label="Prefix" />
                <InputField propName="run_number" label="Run number" />
            </FieldsRow>
          </Form>

          <FieldsHeader title="Acquisition" />
          <Form horizontal>
            <FieldsRow>
              <InputField propName="osc_range" label="Oscillation range" />
              <InputField propName="first_image" label="First image" />
            </FieldsRow>
            <FieldsRow>
              <InputField propName="osc_start" label="Oscillation start" />
              <InputField propName="num_images" label="Number of images" />
            </FieldsRow>
            <FieldsRow>
              <InputField propName="exp_time" label="Exposure time (ms)" />
              <InputField propName="transmission" label="Transmission" />
            </FieldsRow>
            <FieldsRow>
              <InputField propName="energy" label="Energy" />
              <InputField propName="resolution" label="Resolution" />
            </FieldsRow>
            <CollapsableRows>
              <FieldsRow>
                <InputField propName="kappa" label="Kappa" />
                <InputField propName="kappa_phi" label="Phi" />
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

DataCollection = reduxForm({
  form: 'datacollection',
  validate
})(DataCollection);

DataCollection = connect(state => ({
  motorLimits: state.beamline.motorsLimits,
  acqParametersLimits: state.taskForm.acqParametersLimits,
  initialValues: {
    ...state.taskForm.taskData.parameters,
    beam_size: state.sampleview.currentAperture
  }
})
)(DataCollection);

export default DataCollection;

