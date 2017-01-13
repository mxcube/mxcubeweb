import React from 'react';
import { reduxForm } from 'redux-form';
import { Modal } from 'react-bootstrap';

class AddSample extends React.Component {
  constructor(props) {
    super(props);
    this.addAndEnqueue = this.addAndEnqueue.bind(this);
    this.addAndMount = this.addAndMount.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.getDefaultSampleData = this.getDefaultSampleData.bind(this);
  }


  getDefaultSampleData() {
    let prefix = this.props.values.sampleName ? this.props.values.sampleName : 'noname';

    if (this.props.values.proteinAcronym && this.props.values.sampleName) {
      prefix += `-${this.props.values.proteinAcronym}`;
    }

    return { ...this.props.values,
             type: 'Sample',
             defaultPrefix: prefix,
             location: 'Manual',
             loadable: true,
             tasks: [] };
  }


  handleCancel() {
    this.props.hide();
  }


  addAndEnqueue() {
    this.props.addToQueue(this.getDefaultSampleData());
    this.props.hide();
  }


  addAndMount() {
    this.props.addAndMount(this.getDefaultSampleData());
    this.props.hide();
  }


  render() {
    const { fields: { sampleName, proteinAcronym } } = this.props;
    return (
      <Modal show={this.props.show} onHide={this.handleCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Add Sample Manually</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="form-horizontal">
            <div className="form-group">
              <label className="col-sm-3 control-label">Sample Name:</label>
                <div className="col-sm-3">
                  <input type="text" className="form-control" {...sampleName} />
                </div>
              <label className="col-sm-3 control-label">Protein Acronym:</label>
              <div className="col-sm-3">
                <input type="text" className="form-control" {...proteinAcronym} />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-primary"
            type="button"
            onClick={this.addAndEnqueue}
          >
            Add Sample
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={this.addAndMount}
          >
            Add and mount sample
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

// THIS IS THE IMPORTANT PART!
AddSample = reduxForm({
  // A unique name for this form
  form: 'addsample',
  // All the fields in your form
  fields: ['sampleName', 'proteinAcronym']
},
state => ({ // will pull state into form's initialValues
  initialValues: { ...state.taskForm.taskData.parameters }
}))(AddSample);

export default AddSample;
