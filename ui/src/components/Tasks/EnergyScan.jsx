import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, formValueSelector } from 'redux-form';
import { DraggableModal } from '../DraggableModal';
import { Modal, Button, Form, Row, Col, ButtonToolbar } from 'react-bootstrap';
import validate from './validate';
import { FieldsHeader, StaticField, InputField } from './fields';
import PeriodicTable from '../PeriodicTable/PeriodicTable';

class EnergyScan extends React.Component {
  constructor(props) {
    super(props);

    this.submitAddToQueue = this.submitAddToQueue.bind(this);
    this.submitRunNow = this.submitRunNow.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
    this.elementSelected = this.elementSelected.bind(this);
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
      type: 'EnergyScan',
      label: params.wfname,
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
      'wfname',
      'wfpath',
      'suffix',
      'element',
      'edge'
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  elementSelected(el) {
    this.props.change('element', el);
    let edge = '';

    this.props.availableElements.forEach((item) => {
      if (item.symbol === el) {
        edge = item.energy;
      }
    });

    this.props.change('edge', edge);
  }

  render() {
    const availableElements = this.props.availableElements.map((item) => (
      item.symbol
    ));

    return (<DraggableModal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Energy Scan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <StaticField label="Path" data={this.props.path} />
            <StaticField label="Filename" data={this.props.filename} />
            <Row className='mb-2'>
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
            <FieldsHeader title="Element" />
            <PeriodicTable
              availableElements={availableElements}
              onElementSelected={this.elementSelected}
            />
            <Row>
              <Col xs={12} style={{ marginTop: '10px' }}>
                <InputField propName="element" label="Element" col1="4" col2="2" />
              </Col>
            </Row>
            <Row>
              <Col xs={12} style={{ marginTop: '10px' }}>
                <InputField propName="edge" label="Edge" col1="4" col2="2" />
              </Col>
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
               <Button variant="outline-secondary" disabled={this.props.invalid}
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

EnergyScan = reduxForm({
  form: 'workflow',
  validate
})(EnergyScan);

const selector = formValueSelector('workflow');

EnergyScan = connect(state => {
  const subdir = selector(state, 'subdir');
  const element = selector(state, 'element');
  const edge = selector(state, 'edge');
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';
  let position = state.taskForm.pointID === '' ? 'PX' : state.taskForm.pointID;
  if (typeof position === 'object') {
    const vals = Object.values(position).sort();
    position = `[${vals}]`;
  }

  return {
    path: `${state.login.rootPath}/${subdir}`,
    filename: state.taskForm.taskData.parameters.fileName,
    edge,
    element,
    wfname: state.taskForm.taskData.parameters.wfname,
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
        state.beamline.attributes.energy.value),
      transmission: (state.taskForm.taskData.sampleID ?
        state.taskForm.taskData.parameters.transmission :
        state.beamline.attributes.transmission.value)
    }
  };
})(EnergyScan);

export default EnergyScan;
