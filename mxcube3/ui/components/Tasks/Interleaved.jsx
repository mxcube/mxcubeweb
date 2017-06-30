import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { DraggableModal } from '../DraggableModal';
import { Modal, Button, Form, Row, Col, ButtonToolbar, Table } from 'react-bootstrap';
import validate from './validate';
import { FieldsHeader, StaticField, InputField } from './fields';

class Interleaved extends React.Component {
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
      type: 'Interleaved',
      shape: this.props.pointID,
      suffix: this.props.suffix
    };

    // Form gives us all parameter values in strings so we need to transform numbers back
    const stringFields = [
      'centringMethod',
      'prefix',
      'subdir',
      'type',
      'shape',
      'label',
      'suffix'
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  render() {
    return (<DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Interleaved data collection</Modal.Title>
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
            <Row>
              <Col xs={4}>
                <InputField propName="delta_phi" label="&Delta; osc" col1="6" col2="6" />
              </Col>
            </Row>
            <Table
              striped
              condensed
              bordered
              hover
              style={{ fontSize: 'smaller', marginBottom: '0px' }}
              className="task-parameters-table"
            >
              <thead>
                <tr>
                  <th>Wedge </th>
                  <th>Start &deg; </th>
                  <th>Osc. &deg; </th>
                  <th># Img</th>
                  <th>t (ms)</th>
                  <th>T (%)</th>
                  <th>Res. (&Aring;)</th>
                  <th>E (KeV)</th>
                  <th>&phi; &deg;</th>
                  <th>&kappa; &deg;</th>
                </tr>
              </thead>
              <tbody>
                {this.props.tasks.map((task, i) => (
                  <tr>
                    <td>{i}</td>
                    <td>{task.parameters.osc_start}</td>
                    <td>{task.parameters.osc_range}</td>
                    <td>{task.parameters.exp_time * 1000}</td>
                    <td>{task.parameters.num_images}</td>
                    <td>{task.parameters.resolution}</td>
                    <td>{task.parameters.transmission}</td>
                    <td>{task.parameters.energy}</td>
                    <td>{task.parameters.kappa_phi}</td>
                    <td>{task.parameters.kappa}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Form>
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

Interleaved = reduxForm({
  form: 'workflow',
  validate
})(Interleaved);

const selector = formValueSelector('workflow');

Interleaved = connect(state => {
  const subdir = selector(state, 'subdir');
  const prefix = selector(state, 'prefix');
  const runNumber = selector(state, 'run_number');
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';
  const position = state.taskForm.pointID === '' ? state.taskForm.pointID : 'PX';

  return {
    path: `${state.queue.rootPath}/${subdir}`,
    filename: `${prefix}_${position}_${runNumber}${fileSuffix}`,
    acqParametersLimits: state.taskForm.acqParametersLimits,
    tasks: state.taskForm.taskData.parameters.tasks,
    suffix: fileSuffix,
    initialValues: {
      ...state.taskForm.taskData.parameters.tasks[0].parameters,
      beam_size: state.sampleview.currentAperture,
      resolution: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.tasks[0].parameters.resolution :
        state.beamline.attributes.resolution.value),
      energy: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.tasks[0].parameters.energy :
        state.beamline.attributes.energy.value)
    }
  };
})(Interleaved);

export default Interleaved;
