import React from 'react';
import { bindActionCreators, createStore, combineReducers } from 'redux';
import { connect, Provider } from 'react-redux';
import { reducer as formReducer } from 'redux-form';
import { Modal } from 'react-bootstrap';
import Liform from 'liform-react';
import { showWorkflowParametersDialog } from '../actions/workflow';

class WorkflowParametersDialog extends React.Component {
  constructor(props) {
    super(props);
    const reducer = combineReducers({ form: formReducer });
    this.store = (window.devToolsExtension ?
                  window.devToolsExtension()(createStore) :
                  createStore)(reducer);
  }

  showResults(/* values */) {
    // window.alert(`You submitted:\n\n ${JSON.stringify(values, null, 2)}`);
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
          <Liform schema={this.props.formData} onSubmit={this.showResults} />
        </Provider>
      );

      formName = this.props.formData.dialogName;
    }

    return (
      <Modal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>{formName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div id="form-holder">
            {form}
          </div>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>);
  }
}


function mapStateToProps(state) {
  return {
    show: state.workflow.showParametersDialog,
    formData: state.workflow.formData
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(showWorkflowParametersDialog.bind(this, null, false), dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowParametersDialog);
