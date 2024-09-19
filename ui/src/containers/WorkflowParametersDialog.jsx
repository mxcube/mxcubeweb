import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from 'react-bootstrap';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import {
  showWorkflowParametersDialog,
  submitWorkflowParameters,
} from '../actions/workflow';

import styles from './WorkflowParametersDialog.module.css';

function WorkflowParametersDialog() {
  const dispatch = useDispatch();
  const show = useSelector((state) => state.workflow.showDialog);
  const formData = useSelector((state) => state.workflow.formData);

  function submitData(values) {
    dispatch(submitWorkflowParameters(values.formData));
    dispatch(showWorkflowParametersDialog(null, false));
  }

  return (
    <Modal
      show={show}
      onHide={() => dispatch(showWorkflowParametersDialog(null, false))}
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>{formData ? formData.dialogName : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="form-holder">
          {/* The Liform generates errors when `schema` is empty or null so
              we only create it when show is true and we have a schema to use. */}
          {show && formData && (
            <div className={styles.rjsfFormContainer}>
              <Form
                validator={validator}
                schema={formData}
                formData={formData.initialValues}
                onSubmit={submitData}
                onError={console.log('errors')} // eslint-disable-line no-console
              />
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer />
    </Modal>
  );
}

export default WorkflowParametersDialog;
