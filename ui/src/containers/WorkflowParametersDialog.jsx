import React from 'react';
import { bindActionCreators, createStore, combineReducers } from 'redux';
import { connect, Provider } from 'react-redux';
import { reducer as formReducer } from 'redux-form';
import { Modal } from 'react-bootstrap';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import {
  showWorkflowParametersDialog,
  workflowSubmitParameters,
} from '../actions/workflow';

import './WorkflowParametersDialog.css';

class WorkflowParametersDialog extends React.Component {
  constructor(props) {
    super(props);
    this.submitData = this.submitData.bind(this);
    const reducer = combineReducers({ form: formReducer });
    this.store = (
      window.devToolsExtension
        ? window.devToolsExtension()(createStore)
        : createStore
    )(reducer);
  }

  submitData(values) {
    this.props.workflowSubmitParameters(values.formData);
    this.props.hide();
  }

  render() {
    let form = '';
    let formName = '';

    // The Liform generates some errors when schema is empty or null so
    // we only create it when show is true and we have a schema to use.
    // The errors will otherwise prevent the dialog from beeing closed
    // properly.

    if (this.props.show && this.props.formData) {
      form = (
        <Provider store={this.store}>
          <Form
            validator={validator}
            schema={this.props.formData}
            formData={this.props.formData.initialValues}
            onSubmit={this.submitData} // eslint-disable-line react/jsx-handler-names
            onError={console.log('errors')} // eslint-disable-line no-console
          />
        </Provider>
      );

      formName = this.props.formData.dialogName;
    }

    return (
      // eslint-disable-next-line react/jsx-handler-names
      <Modal show={this.props.show} onHide={this.props.hide} backdrop="static">
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
    workflowSubmitParameters: bindActionCreators(
      workflowSubmitParameters,
      dispatch,
    ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WorkflowParametersDialog);
