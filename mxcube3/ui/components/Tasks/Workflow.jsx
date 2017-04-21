import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';

import { Modal, Button, Form, Row, Col, ButtonToolbar } from 'react-bootstrap';
import validate from './validate';
import { FieldsHeader, StaticField, InputField } from './fields';

class Workflow extends React.Component {
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
      type: 'Workflow',
      label: params.wfname,
      shape: this.props.pointID
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
      'wfpath'
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  render() {
    return (<Modal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.wfname}</Modal.Title>
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
                <InputField propName="run_number" label="Run number" col1="4" col2="8" />
              </Col>
            </Row>
          </Form>
       </Modal.Body>

       { this.props.taskData.state ? '' :
           <Modal.Footer>
             <ButtonToolbar className="pull-right">
               <Button bsStyle="success"
                 disabled={this.props.pointID === -1 || this.props.invalid}
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
      </Modal>);
  }
}

Workflow = reduxForm({
  form: 'workflow',
  validate
})(Workflow);

const selector = formValueSelector('workflow');

Workflow = connect(state => {
  const subdir = selector(state, 'subdir');
  const prefix = selector(state, 'prefix');
  const runNumber = selector(state, 'run_number');

  return {
    path: `${state.queue.rootPath}/${subdir}`,
    filename: `${prefix}_${runNumber}.???`,
    wfname: state.taskForm.taskData.parameters.wfname,
    motorLimits: state.beamline.motorsLimits,
    acqParametersLimits: state.taskForm.acqParametersLimits,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture
    }
  };
})(Workflow);

export default Workflow;
