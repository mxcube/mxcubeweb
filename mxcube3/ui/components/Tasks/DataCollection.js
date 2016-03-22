'use strict';

import React from 'react'
import {reduxForm} from 'redux-form';
import Modal from 'react-modal';


class DataCollection extends React.Component {


  constructor(props) {
        super(props);
        this.runNow = this.handleSubmit.bind(this, true);
        this.addToQueue = this.handleSubmit.bind(this, false);
  }

    handleSubmit(runNow){


        let parameters = {
            ...this.props.values,
            Type : "DataCollection",
            point : this.props.pointId
        };
        if (this.props.sampleIds.constructor == Array){

            this.props.sampleIds.map((sampleId) =>{

                let queueId = this.props.lookup[sampleId];

                if (queueId) {
                    this.props.addTask(queueId, sampleId, parameters);
                } else {
                    // the sample is not in queue yet
                    this.props.addSampleAndTask(sampleId, parameters);
                }  
            });
          
        }else{
            let sample_queue_id = this.props.lookup[ this.props.sampleIds];
            this.props.changeTask(this.props.taskData.queue_id, sample_queue_id,this.props.sampleIds, parameters, runNow);
        }

        this.props.hide();
    }


    render() {

        const {fields: {num_images, first_image, exp_time, resolution, osc_start , energy, osc_range, transmission, shutterless, inverse_beam,centringMethod, detector_mode, kappa, kappa_phi, space_group}} = this.props;

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
              <button type="button" className="close" onClick={this.props.hide}>
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </button>
              <h4 className="modal-title">Standard Collection</h4>
            </div>
            <div className="modal-body">

                <h5>Acquisition</h5>
                <hr />
                <form className="form-horizontal">

                    <div className="form-group">
                        <label className="col-sm-3 control-label">Oscillation range:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...osc_range} />
                        </div>

                        <label className="col-sm-3 control-label">First Image:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...first_image} />
                        </div>

                    </div>

                    <div className="form-group">
                        <label className="col-sm-3 control-label">Oscillation start:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...osc_start} />
                        </div>

                        <label className="col-sm-3 control-label">Number of images:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...num_images} />
                        </div>

                    </div>
                    <div className="form-group">

                        <label className="col-sm-3 control-label">Kappa:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...kappa} />
                        </div>

                        <label className="col-sm-3 control-label">Phi:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...kappa_phi} />
                        </div>

                    </div>

                    <div className="form-group">

                        <label className="col-sm-3 control-label">Exposure time(ms):</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...exp_time} />
                        </div>
                        <label className="col-sm-3 control-label">Transmission (%)</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...transmission} />
                        </div>

                    </div>

                    <div className="form-group">

                        <label className="col-sm-3 control-label">Energy (KeV)</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...energy} />
                        </div>

                        <label className="col-sm-3 control-label">
                        <input type="checkbox" />
                        MAD
                        </label>
                        <div className="col-sm-3">
                             <select className="form-control" >
                                <option value="ip">ip:-</option>
                                <option value="pk">pk:-</option>
                            </select>
                        </div>



                    </div>

                    <div className="form-group">


                        <label className="col-sm-3 control-label">Resolution (A)</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...resolution} />
                        </div>

                        <label className="col-sm-3 control-label">Detector mode:</label>
                        <div className="col-sm-3">
                             <select className="form-control"  {...detector_mode}>
                                <option value="0">0</option>
                                <option value="C18">C18</option>
                                <option value="C2">C2</option>
                            </select>
                        </div>


                    </div>


                    <div className="form-group">

                        <label className="col-sm-3 control-label">Beam size:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" />
                        </div>


                        <label className="col-sm-3 control-label">Subwedge size:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" />
                        </div>

                    </div>

                    <div className="form-group">

                        <label className="col-sm-3 control-label">
                            <input type="checkbox" {...shutterless} />
                            Shutterless
                        </label>

                        <label className="col-sm-3 control-label">
                            <input type="checkbox" {...inverse_beam} />
                            Inverse beam
                        </label>

                    </div>



                    <h5>Data location</h5>
                    <hr />


                     <div className="form-group">

                        <label className="col-sm-3 control-label">Data path:</label>
                        <div className="col-sm-9">
                            <input type="text" className="form-control" />
                        </div>


                    </div>  
                     <div className="form-group">

                        <label className="col-sm-3 control-label">File name:</label>
                        <div className="col-sm-9">
                            <input type="text" className="form-control" value={"asdas"} />
                        </div>


                    </div>  

                     <div className="form-group">

                        <label className="col-sm-3 control-label">Prefix:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" />
                        </div>

                        <label className="col-sm-3 control-label">Run number:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" />
                        </div>

                    </div>                   

                    <h5>Processing</h5>
                    <hr />

                    <div className="form-group">
                        <label className="col-sm-3 control-label">N.o. residues:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" />
                        </div>

                        <label className="col-sm-3 control-label">Space group:</label>
                        <div className="col-sm-3">
                             <select className="form-control" {...space_group}>
                                <option value="1"></option>
                                <option value="1">X</option>
                                <option value="1">Y</option>
                            </select>
                        </div>

                    </div>

                    <h6>Unit cell:</h6>
                    <div className="form-group">

                        <label className="col-sm-2 control-label">a:</label>
                        <div className="col-sm-2">
                            <input type="number" className="form-control" />
                        </div>

                        <label className="col-sm-2 control-label">b:</label>
                        <div className="col-sm-2">
                            <input type="number" className="form-control"/>
                        </div>

                        <label className="col-sm-2 control-label">c:</label>
                        <div className="col-sm-2">
                            <input type="number" className="form-control" />
                        </div>

                        <label className="col-sm-2 control-label"> &alpha;:</label>
                        <div className="col-sm-2">
                            <input type="number" className="form-control" />
                        </div>                                                

                        <label className="col-sm-2 control-label">  &beta;:</label>
                        <div className="col-sm-2">
                            <input type="number" className="form-control" />
                        </div>

                        <label className="col-sm-2 control-label">  &gamma;:</label>
                        <div className="col-sm-2">
                            <input type="number" className="form-control" />
                        </div>

                    </div>
                </form>
            </div>
            <div className="modal-footer">
          <div className={this.props.pointId === -1 ? "pull-left" : "hidden"}>
            <label className="centring-method">
              <input type="radio" {...centringMethod} value="lucid" checked={centringMethod.value === 'lucid'}/> Lucid Only  
            </label>
            <label className="centring-method">
              <input type="radio" {...centringMethod} value="xray" checked={centringMethod.value === 'xray'}/> X-ray Centring 
            </label>
          </div>
              <button type="button" className={this.props.pointId !== -1 ? "btn btn-success" : "hidden"} onClick={this.runNow}>Run Now</button>
              <button type="button" className="btn btn-primary" onClick={this.addToQueue}>{this.props.taskData.queue_id ? "Change": "Add to Queue"}</button>
            </div>
          </div>
        </Modal>
        );
    }
}

DataCollection = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'datacollection',                           // a unique name for this form
  fields: ['num_images', 'first_image', 'exp_time', 'resolution', 'osc_start' , 'energy', 'osc_range', 'transmission', 'shutterless','inverse_beam','centringMethod', 'detector_mode', 'kappa', 'kappa_phi', 'space_group' ] // all the fields in your form
},
state => ({ // mapStateToProps
  initialValues: {...state.taskForm.taskData.parameters} // will pull state into form's initialValues
}))(DataCollection);

export default DataCollection;