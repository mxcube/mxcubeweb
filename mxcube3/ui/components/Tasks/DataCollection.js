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
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
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
      suffix: this.props.suffix
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
      'suffix'
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
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
              <Col xs={4}>
                <InputField propName="run_number" disabled label="Run number" col1="4" col2="8" />
              </Col>
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

       { this.props.taskData.state ? '' :
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
                 {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
               </Button>
             </ButtonToolbar>
           </Modal.Footer>
       }
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
  const prefix = selector(state, 'prefix');
  const runNumber = selector(state, 'run_number');
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';
  let position = state.taskForm.pointID === '' ? 'PX' : state.taskForm.pointID;
  if (typeof position === 'object') {
    const vals = Object.values(position).sort();
    position = `[${vals}]`;
  }

  return {
    path: `${state.queue.rootPath}/${subdir}`,
    filename: `${prefix}_${position}_${runNumber}${fileSuffix}`,
    acqParametersLimits: state.taskForm.acqParametersLimits,
    suffix: fileSuffix,
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
