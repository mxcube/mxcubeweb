import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import {
  showWorkflowParametersDialog,
  submitWorkflowParameters,
} from '../actions/workflow';

import './WorkflowParametersDialog.css';

function WorkflowParametersDialog(props) {
  function submitData(values) {
    props.workflowSubmitParameters(values.formData);
    props.hide();
  }

  let form = '';
  let formName = '';

  // The Liform generates some errors when schema is empty or null so
  // we only create it when show is true and we have a schema to use.
  // The errors will otherwise prevent the dialog from being closed
  // properly.

  if (props.show && props.formData) {
    form = (
      <div>
        <Form
          validator={validator}
          schema={props.formData}
          formData={props.formData.initialValues}
          onSubmit={submitData}
          onError={console.log('errors')} // eslint-disable-line no-console
        />
      </div>
    );

    formName = props.formData.dialogName;
  }

  return (
    // eslint-disable-next-line react/jsx-handler-names
    <Modal show={props.show} onHide={props.hide} backdrop="static">
      <Modal.Header>
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
    show: state.workflow.showParametersDialog,
    formData: state.workflow.formData,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(
      showWorkflowParametersDialog.bind(null, null, false),
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
)(WorkflowParametersDialog);
