import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Modal, ButtonToolbar, Button, Form } from 'react-bootstrap';
import { InputField, FieldsRow } from './fields';
import validate from './validate_add_sample';

class AddSample extends React.Component {
  constructor(props) {
    super(props);

    this.addAndEnqueue = this.addAndEnqueue.bind(this);
    this.addAndMount = this.addAndMount.bind(this);
    this._addAndEnqueue = this._addAndEnqueue.bind(this);
    this._addAndMount = this._addAndMount.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.getDefaultSampleData = this.getDefaultSampleData.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  getDefaultSampleData(params) {
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

  handleCancel() {
    this.props.hide();
  }

  _addAndEnqueue(params) {
    const sampleData = this.getDefaultSampleData(params);
    this.props.addToQueue(sampleData);
    this.props.hide();
  }

  addAndEnqueue() {
    this.props.handleSubmit(this._addAndEnqueue)();
  }

  _addAndMount(params) {
    const sampleData = this.getDefaultSampleData(params);
    this.props.addAndMount(sampleData);
    this.props.hide();
  }

  addAndMount() {
    this.props.handleSubmit(this._addAndMount)();
  }

  handleKeyPress(target) {
    if (target.charCode === 13) {
      this.addAndMount();
    }
  }

  render() {
    return (
      <Modal
        // fullscreen
        show={this.props.show}
        onHide={this.handleCancel}
        // style={{ width: '60%', height: '20%'}}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Sample Manually</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <FieldsRow>
              <InputField
                propName="sampleName"
                autoFocus
                label="Sample Name"
                ref={(ref) => {
                  this.sampleName = ref;
                }}
                col1="4"
                col2="6"
              />
              <InputField
                propName="proteinAcronym"
                label="Protein Acronym"
                ref={(ref) => {
                  this.proteinAcronym = ref;
                }}
                col1="4"
                col2="6"
                onKeyPress={this.handleKeyPress}
              />
            </FieldsRow>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar>
            <Button
              variant="outline-secondary"
              disabled={this.props.invalid}
              onClick={this.addAndEnqueue}
            >
              Add Sample
            </Button>
            <Button
              className="ms-3"
              variant="outline-secondary"
              disabled={this.props.invalid}
              onClick={this.addAndMount}
            >
              Add and mount sample
            </Button>
          </ButtonToolbar>
        </Modal.Footer>
      </Modal>
    );
  }
}

AddSample = reduxForm({
  form: 'addsample',
  validate,
})(AddSample);

AddSample = connect((state) => ({
  initialValues: { ...state.taskForm.taskData.parameters },
}))(AddSample);

export default AddSample;
