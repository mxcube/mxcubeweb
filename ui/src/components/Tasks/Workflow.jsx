import { Button, ButtonToolbar, Modal, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Form, formValueSelector, reduxForm } from 'redux-form';

import { DraggableModal } from '../DraggableModal';
import { InputField, SelectField, StaticField } from './fields';
import validate from './validate';

function Workflow(props) {
  const isGphlWorkflow = props.wfpath === 'Gphl';

  const strategyNames = isGphlWorkflow
    ? Object.values(props.taskData.parameters.strategies).map(
        ({ title }) => title,
      )
    : [];

  function addToQueue(runNow, params) {
    const parameters = {
      ...params,
      type: isGphlWorkflow ? 'GphlWorkflow' : 'Workflow',
      label: params.wfname,
      shape: props.pointID,
      suffix: props.suffix,
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
    ];

    if (isGphlWorkflow) {
      parameters.strategy_name = props.strategy_name;
      stringFields.push('strategy_name');
    }

    props.addTask(parameters, stringFields, runNow);
    props.hide();
  }

  return (
    <DraggableModal show={props.show} onHide={props.hide}>
      <Modal.Header closeButton>
        <Modal.Title>{props.wfname}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <StaticField label="Path" data={props.path} />
          <StaticField label="Filename" data={props.filename} />
          <Row className="mt-3">
            <InputField
              propName="subdir"
              label="Subdirectory"
              col1={4}
              col2={7}
            />
          </Row>
          <Row className="mt-3">
            <InputField propName="prefix" label="Prefix" col1={4} col2={7} />
          </Row>
          {props.taskData.sampleID ? (
            <Row className="mt-3">
              <InputField
                propName="run_number"
                disabled
                label="Run number"
                col1={4}
                col2={7}
              />
            </Row>
          ) : null}
          {strategyNames.length > 0 && (
            <div className="mt-3">
              <SelectField
                propName="strategy_name"
                label="Workflow Strategy"
                list={strategyNames}
                col1={4}
                col2={7}
              />
            </div>
          )}
        </Form>
      </Modal.Body>

      {props.taskData.state ? (
        ''
      ) : (
        <Modal.Footer>
          <ButtonToolbar className="float-end">
            <Button
              variant="success"
              disabled={props.origin === 'samplelist' || props.invalid}
              onClick={props.handleSubmit((params) => addToQueue(true, params))}
            >
              Run Now
            </Button>
            <Button
              className="ms-3"
              variant="primary"
              disabled={props.invalid}
              onClick={props.handleSubmit((params) =>
                addToQueue(false, params),
              )}
            >
              {props.taskData.sampleID ? 'Change' : 'Add to Queue'}
            </Button>
          </ButtonToolbar>
        </Modal.Footer>
      )}
    </DraggableModal>
  );
}

const WorkflowForm = reduxForm({
  form: 'workflow',
  validate,
})(Workflow);

const selector = formValueSelector('workflow');

const WorkflowFormConnect = connect((state) => {
  const subdir = selector(state, 'subdir');
  const fileSuffix = state.taskForm.fileSuffix === 'h5' ? '_master.h5' : 'cbf';
  const strategy_name = selector(state, 'strategy_name');
  let position = state.taskForm.pointID === '' ? 'PX' : state.taskForm.pointID;
  if (typeof position === 'object') {
    const vals = Object.values(position).sort();
    position = `[${vals}]`;
  }

  let fname = '';

  if (state.taskForm.taskData.sampleID) {
    fname = state.taskForm.taskData.parameters.fileName;
  } else {
    const prefix = selector(state, 'prefix');
    fname = `${prefix}_[RUN#]_[IMG#]`;
  }

  const limits = {};

  return {
    path: `${state.login.rootPath}/${subdir}`,
    origin: state.taskForm.origin,
    filename: fname,
    wfname: state.taskForm.taskData.parameters.wfname,
    wfpath: state.taskForm.taskData.parameters.wfpath,
    acqParametersLimits: limits,
    beamline: state.beamline,
    suffix: fileSuffix,
    strategy_name,
    initialValues: {
      ...state.taskForm.taskData.parameters,
      beam_size: state.sampleview.currentAperture,
    },
  };
})(WorkflowForm);

export default WorkflowFormConnect;
