import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { DraggableModal } from '../DraggableModal';
import { Modal, Button, Form, Row, Col, ButtonToolbar } from 'react-bootstrap';
import validate from './validate';
import { StaticField, InputField, SelectField } from './fields';

 

class GphlWorkflow extends React.Component {
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
      type: 'GphlWorkflow',
      // label: this.props.strategy_name,
      // wfname: this.props.strategy_name,
      shape: this.props.pointID,
      suffix: this.props.suffix,
      strategy_name: this.props.strategy_name
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
      'strategy_name'
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  render() {
    const strategy_names = [];
    Object.values(this.props.taskData.parameters.strategies).forEach((result) => {
      strategy_names.push(result.title);
    });
    return (<DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.wfname}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <StaticField label="Path" data={this.props.path} />
            <StaticField label="Filename" data={this.props.filename} />
            <Row className='mt-3'>
              <InputField propName="subdir" label="Subdirectory" col1={4} col2={7} />
            </Row>
            <Row className='mt-3'>
              <InputField propName="prefix" label="Prefix" col1={4} col2={7} />
            </Row>
            <Row className='mt-3'>
              {this.props.taskData.sampleID ?
                (
                  <InputField
                    propName="run_number"
                    disabled
                    label="Run number"
                    col1={4}
                    col2={7}
                  />)
                : null}
            </Row>
            <Row className='mt-3'>
              <SelectField propName="strategy_name" label="Workflow Strategy" list={strategy_names} col1={4} col2={7} />
            </Row>
          </Form>
       </Modal.Body>

       { this.props.taskData.state ? '' :
           <Modal.Footer>
             <ButtonToolbar className="pull-right">
               <Button variant="success"
                 disabled={this.props.taskData.parameters.shape === -1 || this.props.invalid}
                 onClick={this.submitRunNow}
               >
                 Run Now
               </Button>
               <Button className='ms-3' variant="primary" disabled={this.props.invalid}
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

GphlWorkflow = reduxForm({
  form: 'gphlworkflow',
  validate
})(GphlWorkflow);

const selector = formValueSelector('gphlworkflow');

GphlWorkflow = connect(state => {
  const subdir = selector(state, 'subdir');
  const strategy_name = selector(state, 'strategy_name');
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';

  const { type } = state.taskForm.taskData;
  const limits = state.taskForm.defaultParameters[type.toLowerCase()].limits;

  return {
    path: `${state.login.rootPath}/${subdir}`,
    wfname: state.taskForm.taskData.parameters.wfname,
    acqParametersLimits: limits,
    suffix: fileSuffix,
    strategy_name,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.resolution :
        state.beamline.hardwareObjects.resolution.value),
      energy: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.energy :
        state.beamline.hardwareObjects.energy.value),
      transmission: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.transmission :
        state.beamline.hardwareObjects.transmission.value)
    }
  };
})(GphlWorkflow);

export default GphlWorkflow;
