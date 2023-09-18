import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Modal, ButtonToolbar, Button, Form } from 'react-bootstrap';
import { InputField, FieldsRow } from './fields';
import validate from './validate_add_sample';
import { bindActionCreators } from 'redux';
import { addSamplesToList } from '../../actions/sampleGrid';
import { addSampleAndMount, addSamplesToQueue } from '../../actions/queue';

function getDefaultSampleData(params) {
  let prefix = params.sampleName ? params.sampleName : 'noname';

  if (params.proteinAcronym && params.sampleName) {
    prefix = `${params.proteinAcronym}-${prefix}`;
  }

  return {
    ...params,
    type: 'Sample',
    defaultPrefix: prefix,
    location: 'Manual',
    loadable: true,
    tasks: [],
  };
}

function AddSample(props) {
  const {
    show,
    hide,
    invalid,
    handleSubmit,
    addSamplesToList,
    addSampleAndMount,
    addSamplesToQueue,
  } = props;

  function addAndMount(params) {
    const sampleData = getDefaultSampleData(params);
    addSamplesToList([sampleData]);
    addSampleAndMount(sampleData);
    hide();
  }

  function addAndQueue(params) {
    const sampleData = getDefaultSampleData(params);
    addSamplesToList([sampleData]);
    addSamplesToQueue([sampleData]);
    hide();
  }

  return (
    <Modal show={show} onHide={hide}>
      <Form
        onSubmit={(evt) => {
          evt.preventDefault();
          handleSubmit(addAndMount)();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>New Sample</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FieldsRow>
            <InputField
              propName="sampleName"
              autoFocus
              label="Sample Name"
              col1="4"
              col2="6"
            />
            <InputField
              propName="proteinAcronym"
              label="Protein Acronym"
              col1="4"
              col2="6"
            />
          </FieldsRow>
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar>
            <Button className="me-3" type="submit" disabled={invalid}>
              Mount
            </Button>
            <Button
              variant="outline-secondary"
              disabled={invalid}
              onClick={() => {
                handleSubmit(addAndQueue)();
              }}
            >
              Queue
            </Button>
          </ButtonToolbar>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

const AddSampleForm = reduxForm({
  form: 'addsample',
  validate,
})(AddSample);

const AddSampleContainer = connect(
  (state) => ({
    initialValues: { ...state.taskForm.taskData.parameters },
  }),
  (dispatch) => ({
    addSamplesToList: bindActionCreators(addSamplesToList, dispatch),
    addSamplesToQueue: bindActionCreators(addSamplesToQueue, dispatch),
    addSampleAndMount: bindActionCreators(addSampleAndMount, dispatch),
  }),
)(AddSampleForm);

export default AddSampleContainer;
