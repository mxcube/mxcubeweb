import React from 'react';
import { reduxForm } from 'redux-form';
import { Modal } from 'react-bootstrap';


class AddSample extends React.Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit() {
    this.props.add(this.props.id, { ...this.props.values, location: 'Manual', id: this.props.id });
    this.props.hide();
  }


  render() {
    const { fields: { sampleName, proteinAcronym } } = this.props;
    const phase = this.props.phase;
    return (
        <Modal show={this.props.show} onHide={this.props.hide}>
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
                <p className="pull-left">Current Phase: <b>{this.props.phase}</b></p>
                <button
                  className="btn btn-primary"
                  disabled={phase !== 'Transfer'}
                  type="button"
                  onClick={this.handleSubmit}
                >
                  Add Sample
                </button>
          </Modal.Footer>
        </Modal>
        );
  }
}

AddSample = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'addsample',   // a unique name for this form
  fields: ['sampleName', 'proteinAcronym'] // all the fields in your form
},
state => ({ // will pull state into form's initialValues
  initialValues: { ...state.taskForm.taskData.parameters }
}))(AddSample);

export default AddSample;
