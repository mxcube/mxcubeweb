import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Modal, ButtonToolbar, Button, Form } from 'react-bootstrap';
import { InputField, FieldsRow } from './fields';
import validate from './validate_add_sample';
import { bindActionCreators } from 'redux';
import { addSamplesToList } from '../../actions/sampleGrid';
import { addSampleAndMount, addSamplesToQueue } from '../../actions/queue';

class AddSample extends React.Component {
  constructor(props) {
    super(props);

    this.addAndMount = this.props.handleSubmit(this.addAndMount.bind(this));
    this.addAndQueue = this.props.handleSubmit(this.addAndQueue.bind(this));
    this.getDefaultSampleData = this.getDefaultSampleData.bind(this);
  }

  addAndMount(params) {
    const sampleData = this.getDefaultSampleData(params);
    this.props.addSamplesToList([sampleData]);
    this.props.addSampleAndMount(sampleData);
    this.props.hide();
  }

  addAndQueue(params) {
    const sampleData = this.getDefaultSampleData(params);
    this.props.addSamplesToList([sampleData]);
    this.props.addSamplesToQueue([sampleData]);
    this.props.hide();
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

  render() {
    const { show, hide, invalid } = this.props;

    return (
      <Modal show={show} onHide={hide}>
        <Form
          onSubmit={(evt) => {
            evt.preventDefault();
            this.addAndMount();
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
                onClick={() => this.addAndQueue()}
              >
                Queue
              </Button>
            </ButtonToolbar>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
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
