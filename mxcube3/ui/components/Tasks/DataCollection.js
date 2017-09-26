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

class DataCollection extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.showFooter = this.showFooter.bind(this);
    this.showDCFooter = this.showDCFooter.bind(this);
    this.showDPFooter = this.showDPFooter.bind(this);
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
      type: 'DataCollection',
      label: 'Data Collection',
      helical: false,
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

  showDCFooter() {
    return (
       <Modal.Footer>
       <div className="input-group-btn">
          <ButtonToolbar className="pull-left">
           <Button bsSize="xsmall" bsStyle="default"
             onClick={this.defaultParameters}
           >
             Default Parameters
           </Button>
           <Button bsSize="xsmall" bsStyle="default"
             onClick={this.resetParameters}
           >
             Reset Form
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
        </div>
       </Modal.Footer>
      );
  }

  showDPFooter() {
    return (
       <Modal.Footer>
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
             { 'Add Diffraction Plan to Queue' }
           </Button>
         </ButtonToolbar>
       </Modal.Footer>
    );
  }

  showFooter() {
    const isDiffractionPlan = this.props.taskData.isDiffractionPlan;
    let foot = '';

    if (isDiffractionPlan) {
      foot = this.showDPFooter();
    } else {
      foot = this.showDCFooter();
    }
    return foot;
  }

  render() {
    return (<DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Standard Data Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FieldsHeader title="Data location" />
          <Form horizontal>
            <StaticField label="Path" data={this.props.path} />
            <StaticField label="Filename" data={this.props.filename} />
            <Row>
              <Col xs={12} style={{ marginTop: '10px' }}>
                <InputField propName="subdir" label="Subdirectory" col1="4" col2="8" />
              </Col>
            </Row>
            <Row>
              <Col xs={8}>
                <InputField propName="prefix" label="Prefix" col1="6" col2="6" />
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

       { this.props.taskData.state ? '' : this.showFooter() }

      </DraggableModal>);
  }
}

DataCollection = reduxForm({
  form: 'datacollection',
  validate
})(DataCollection);

const selector = formValueSelector('datacollection');

DataCollection = connect(state => {
  const subdir = selector(state, 'subdir');

  let position = state.taskForm.pointID === '' ? 'PX' : state.taskForm.pointID;
  if (typeof position === 'object') {
    const vals = Object.values(position).sort();
    position = `[${vals}]`;
  }

  let fname = '';

  if (state.taskForm.taskData.sampleID) {
    fname = state.taskForm.taskData.parameters.fileName;
  } else {
    // Try to call eval on the file name template, just return the template
    // itself if it fails. Disable eslint since prefix and runNumber are unused
    // by the rest of the code, but possible used in the template. All variables
    // that are to be used in the template should be defined in the try.
    try {
      /*eslint-disable */
      const prefix = selector(state, 'prefix');
      fname = eval(state.taskForm.taskData.parameters.fileNameTemplate);
      /*eslint-enable */
    } catch (e) {
      fname = state.taskForm.taskData.parameters.fileNameTemplate;
    }
  }

  return {
    path: `${state.queue.rootPath}/${subdir}`,
    filename: fname,
    acqParametersLimits: state.taskForm.acqParametersLimits,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.resolution :
        state.beamline.attributes.resolution.value),
      energy: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.energy :
        state.beamline.attributes.energy.value)
    }
  };
})(DataCollection);

export default DataCollection;
