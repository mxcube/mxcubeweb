'use strict';

import React from 'react'
import {reduxForm} from 'redux-form';
import { Modal } from 'react-bootstrap';


class AddSample extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

     handleSubmit(){

        this.props.add(this.props.values.id ,  {...this.props.values, location: "Manual"})

        this.props.hide();
    }
  

    render() {

        const {fields: {id, code, sampleName, proteinAcronym}} = this.props;

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
                            <input type="text" className="form-control" {...sampleName}/>
                        </div>

                        <label className="col-sm-3 control-label">ID:</label>
                        <div className="col-sm-3">
                            <input type="text" className="form-control" {...id}/>
                        </div>
                    </div>
                </form>

                <form className="form-horizontal">

                    <div className="form-group">

                        <label className="col-sm-3 control-label">Code:</label>
                        <div className="col-sm-3">
                            <input type="text" className="form-control" {...code}/>
                        </div>

                        <label className="col-sm-3 control-label">Protein Acronym:</label>
                        <div className="col-sm-3">
                            <input type="text" className="form-control" {...proteinAcronym}/>
                        </div>
                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
              <button className="btn btn-primary" type="button" onClick={this.handleSubmit}>Add Sample</button>
          </Modal.Footer>
        </Modal>
        );
    }
}

AddSample = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'addsample',   // a unique name for this form
  fields: ['id', 'code', 'sampleName', 'proteinAcronym'] // all the fields in your form
},
state => ({ // mapStateToProps
  initialValues: {...state.taskForm.taskData.parameters} // will pull state into form's initialValues
}))(AddSample);

export default AddSample;