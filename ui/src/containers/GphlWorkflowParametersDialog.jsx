import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import {
  showGphlWorkflowParametersDialog,
  submitWorkflowParameters,
} from '../actions/workflow';

import './WorkflowParametersDialog.css';

// This class will be customize to be able to display more
// specific GPHL workflow form
function GphlWorkflowParametersDialog(props) {
  const { formData, show, handleHide, submitWorkflowParameters } = props;

  function submitData(values) {
    submitWorkflowParameters(values.formData);
    handleHide();
  }

  let form = '';
  let formName = '';

  // The Liform generates some errors when schema is empty or null so
  // we only create it when show is true and we have a schema to use.
  // The errors will otherwise prevent the dialog from being closed
  // properly.

  if (show && formData) {
    const schema = formData.schema || formData;
    const uiSchema = formData.ui_schema || {};
    const initialFormData = formData.initialValues || formData.schema;

    form = (
      <div>
        <Form
          validator={validator}
          schema={schema}
          uiSchema={uiSchema}
          formData={initialFormData}
          onSubmit={submitData}
          onError={console.log('errors')} // eslint-disable-line no-console
        />
      </div>
    );

    formName = formData.dialogName;
  }

  return (
    <Modal show={show} onHide={handleHide} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{formName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="form-holder">{form}</div>
      </Modal.Body>
      <Modal.Footer />
    </Modal>
  );
}

function mapStateToProps(state) {
  return {
    show: state.workflow.showGphlDialog,
    formData: state.workflow.gphlParameters,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleHide: bindActionCreators(
      () => showGphlWorkflowParametersDialog(null, false),
      dispatch,
    ),
    submitWorkflowParameters: bindActionCreators(
      submitWorkflowParameters,
      dispatch,
    ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GphlWorkflowParametersDialog);
