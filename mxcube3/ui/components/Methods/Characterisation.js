'use strict';

import React from 'react'
import {reduxForm} from 'redux-form';
import Modal from 'react-modal';


class Characterisation extends React.Component {


  constructor(props) {
        super(props);
        this.runNow = this.handleSubmit.bind(this, true);
        this.addToQueue = this.handleSubmit.bind(this, false);
  }

    handleSubmit(runNow){

        let fields = this.props.fields;
        let parameters = {
            Type : "Characterisation",
            numImages : fields.numImages.value,
            expTime: fields.expTime.value,
            resolution : fields.resolution.value,
            oscStart : fields.oscStart.value,
            energy : fields.energy.value,
            oscRange : fields.oscRange.value,
            transmission : fields.transmission.value,
            point : this.props.pointId,
            centringMethod: fields.centringMethod.value
            };

        if(this.props.methodData === -1){
            this.props.sampleIds.map( (queue_id) =>{
                this.props.addMethod(queue_id, this.props.lookup[queue_id],parameters, runNow);
            });
        }else{
            this.props.changeMethod(this.props.sampleIds, this.props.methodData.queue_id, this.props.lookup[this.props.sampleIds], parameters, runNow);
        }
        this.props.closeModal();
    }


    render() {

        const {fields: {numImages, expTime, resolution, oscStart , energy, oscRange, transmission, centringMethod}} = this.props;

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
            style={style}
        >
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.props.closeModal}>
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </button>
              <h4 className="modal-title">Characterisation</h4>
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
          <div className={this.props.pointId !== -1 ? "pull-left" : "hidden"}>
            <label className="centring-method">
              <input type="radio" {...centringMethod} value="lucid" checked={centringMethod.value === 'lucid'}/> Lucid Only  
            </label>
            <label className="centring-method">
              <input type="radio" {...centringMethod} value="xray" checked={centringMethod.value === 'xray'}/> X-ray Centring 
            </label>
          </div>
              <button type="button" className={this.props.pointId !== -1 ? "btn btn-success" : "hidden"} onClick={this.runNow}>Run Now</button>
              <button type="button" className="btn btn-primary" onClick={this.addToQueue}>{this.props.methodData !== -1 ? "Change": "Add to Queue"}</button>
            </div>
          </div>
        </Modal>
        );
    }
}

Characterisation = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'characterisation',                           // a unique name for this form
  fields: ['numImages', 'expTime', 'resolution', 'oscStart' , 'energy', 'oscRange', 'transmission', 'centringMethod'] // all the fields in your form
},
state => ({ // mapStateToProps
  initialValues: {...state.methodForm.methodData.parameters} // will pull state into form's initialValues
}))(Characterisation);

export default Characterisation;