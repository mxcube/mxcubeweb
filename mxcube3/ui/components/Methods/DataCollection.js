'use strict';

import React from 'react'
import {reduxForm} from 'redux-form';
import Modal from 'react-modal';


class DataCollection extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            queueID: null,
            method: false
        };
    }

    // Check if form should be populated with data, this is the case when user is updating a method
    componentWillReceiveProps(nextProps) {

        // Get node selected by user 
        let selected = nextProps.selected;

        // Check if form is updated with information from the node already
        let update = (selected.queue_id !== this.state.queueID);

        // Check if update is true and if user is changing a method
        if (selected.method && update){

           
            let methodData = nextProps.sampleList[selected.sample_id].methods[selected.queue_id];
          
            let parameters = methodData.parameters;

            this.props.initializeForm({
                numImages: parameters.num_images, 
                expTime: parameters.exp_time, 
                resolution: parameters.resolution, 
                oscStart: parameters.osc_start , 
                energy: parameters.energy, 
                oscRange: parameters.osc_range, 
                transmission: parameters.transmission
            });
        // Clean form to prepare for adding a new datacollection to the sample
        }else if (update){

            this.props.initializeForm({
                numImages: undefined, 
                expTime: undefined, 
                resolution: undefined, 
                oscStart: undefined , 
                energy: undefined, 
                oscRange: undefined, 
                transmission: undefined
            });

        }
        this.setState({
            queueID : selected.queue_id,
            method: selected.method
        });

    }


    handleSubmit(){

        let fields = this.props.fields;
        let parameters = {
            Type : "DataCollection",
            num_images : fields.numImages.value,
            exp_time: fields.expTime.value,
            resolution : fields.resolution.value,
            osc_start : fields.oscStart.value,
            energy : fields.energy.value,
            osc_range : fields.oscRange.value,
            transmission : fields.transmission.value,
            xRay : fields.xRay.value,
            lucid : fields.lucid.value
            };
        if (this.state.method){
            this.props.changeMethod(parameters);
        }else if(this.props.point){
            (this.props.lookup[this.props.current] ? this.props.addMethod(this.props.current, this.props.lookup[this.props.current],parameters): '');
        }else{
            this.props.checked.map( (queue_id) =>{
                 (this.props.lookup[queue_id] ? this.props.addMethod(queue_id, this.props.lookup[queue_id],parameters) : '');
            });
        }
        
        this.props.closeModal();
    }


    render() { 

        const {fields: {numImages, expTime, resolution, oscStart , energy, oscRange, transmission, xRay, lucid}} = this.props;


        const style = {
          overlay : {
            position          : 'fixed',
            top               : 0,
            left              : 0,
            right             : 0,
            bottom            : 0,
            backgroundColor   : 'rgba(255, 255, 255, 0.75)'
        },
        content : {
            position                   : 'absolute',
            top                        : '40px',
            left                       : '40px',
            right                      : '40px',
            bottom                     : '40px',
            border                     : 'none',
            background                 : 'none',
            overflow                   : 'auto',
            WebkitOverflowScrolling    : 'touch',
            borderRadius               : '4px',
            outline                    : 'none',
            padding                    : '20px'

        }
        };


        return (
        <Modal
          className="Modal__Bootstrap modal-dialog"
          closeTimeoutMS={150}
          isOpen={this.props.show}
          onRequestClose={this.handleModalCloseRequest}
          style={style}>
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={() => this.props.closeModal()}>
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </button>
              <h4 className="modal-title">DataCollection</h4>
            </div>
            <div className="modal-body">

        <form className="form-horizontal">

            <div className="form-group">

                <label className="col-sm-3 control-label">Number of images</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...numImages} />
                </div>

                 <label className="col-sm-3 control-label">Exposure time</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...expTime} />
                </div>


            </div>


            <div className="form-group">

                <label className="col-sm-3 control-label">Resolution (A)</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...resolution} />
                </div>

                <label className="col-sm-3 control-label">Oscillation start</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...oscStart} />
                </div>


            </div>


            <div className="form-group">

                <label className="col-sm-3 control-label">Energy (KeV)</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...energy} />
                </div>

                <label className="col-sm-3 control-label">Oscillation range</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...oscRange} />
                </div>

            </div>


            <div className="form-group">

                <label className="col-sm-3 control-label">Transmission (%)</label>
                <div className="col-sm-9">
                    <input type="number" className="form-control" {...transmission} />
                </div>

            </div>

        </form>
            </div>
            <div className="modal-footer">
                <form className="pull-left form-group">
                    <div className="col-sm-1">
                        <input name="group" type="checkbox" {...xRay}/>
                    </div>
                    <label className="col-sm-5 control-label">X-ray Centring</label>
          
                    <div className="col-sm-1">
                        <input name="group" type="checkbox" {...lucid}/>
                    </div>
                    <label className="col-sm-4 control-label">Only Lucid</label>
                </form>

              <button type="button" className="btn btn-default" onClick={() => this.props.closeModal()}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => this.handleSubmit()}>{this.state.method ? "Change DataCollection": "Add DataCollection"}</button>
            </div>
          </div>
        </Modal>
        );
    }
}

DataCollection = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'datacollection',                           // a unique name for this form
  fields: ['numImages', 'expTime', 'resolution', 'oscStart' , 'energy', 'oscRange', 'transmission', 'xRay', 'lucid'] // all the fields in your form
})(DataCollection);

export default DataCollection;