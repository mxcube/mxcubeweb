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
            num_images : fields.num_images.value,
            exp_time: fields.exp_time.value,
            resolution : fields.resolution.value,
            osc_start : fields.osc_start.value,
            energy : fields.energy.value,
            osc_range : fields.osc_range.value,
            transmission : fields.transmission.value,
            point : this.props.pointId,
            detector_mode: fields.detector_mode.value,
            kappa: fields.kappa.value,
            kappa_phi: fields.kappa_phi.value,
            account_rad_damage: fields.account_rad_damage.value,
            opt_sad: fields.opt_sad.value,
            space_group: fields.space_group.value,
            min_crystal_vdim: fields.min_crystal_vdim.value,
            max_crystal_vdim: fields.max_crystal_vdim.value,
            min_crystal_vphi: fields.min_crystal_vphi.value,
            max_crystal_vphi: fields.max_crystal_vphi.value,
            strategy_complexity: fields.strategy_complexity.value

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

        const {fields: {num_images, exp_time, resolution, osc_start , energy, osc_range, transmission, centringMethod, detector_mode, kappa, kappa_phi, account_rad_damage, opt_sad, space_group, min_crystal_vdim, max_crystal_vdim, min_crystal_vphi, max_crystal_vphi, strategy_complexity }} = this.props;

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
              <h4 className="modal-title">Characterisation</h4>
            </div>
            <div className="modal-body">

                <h5>Acquisition</h5>
                <hr />
                <form className="form-horizontal">

                    <div className="form-group">

                        <label className="col-sm-3 control-label">Number of images:</label>
                        <div className="col-sm-3">
                             <select className="form-control" {...num_images}>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="4">4</option>
                            </select>
                        </div>

                        <label className="col-sm-3 control-label">Transmission (%)</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...transmission} />
                        </div>
                    </div>

                    <div className="form-group">

                        <label className="col-sm-3 control-label">Exposure time(ms):</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...exp_time} />
                        </div>

                        <label className="col-sm-3 control-label">Detector mode:</label>
                        <div className="col-sm-3">
                             <select className="form-control"  {...detector_mode}>
                                <option value="1"></option>
                                <option value="1">X</option>
                                <option value="1">Y</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">

                        <label className="col-sm-3 control-label">Oscillation range:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...osc_range} />
                        </div>

                        <label className="col-sm-3 control-label">Resolution (A):</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...resolution} />
                        </div>


                    </div>


                    <div className="form-group">

                        <label className="col-sm-3 control-label">Oscillation start:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...osc_start} />
                        </div>

                        <label className="col-sm-3 control-label">Energy (KeV):</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...energy} />
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

                    <h5>Characterisation</h5>
                    <hr />

                    <div className="form-group">

                        <label className="col-sm-6 control-label">Strategy complexity:</label>
                        <div className="col-sm-6">
                             <select className="form-control"  {...strategy_complexity}>
                                <option value="1">Single subwedge</option>
                                <option value="2">Multiple subwedge</option>
                            </select>
                        </div>

                    </div>

                    <div className="form-group">

                        <label className="col-sm-6 control-label">
                            <input type="checkbox" {...account_rad_damage} />
                             Account for radiation damage
                        </label>
                        <label className="col-sm-6 control-label">
                            <input type="checkbox" {...opt_sad} />
                             Optimised SAD
                        </label>

                    </div>

                    <h5>Crystal</h5>
                    <hr />

                    <div className="form-group">

                        <label className="col-sm-6 control-label">Space group:</label>
                        <div className="col-sm-6">
                             <select className="form-control"  {...space_group}>
                                <option value="1"></option>
                                <option value="1">X</option>
                            </select>
                        </div>

                    </div>
                    <h6>Vertical crystal dimension(mm)</h6>
                    <div className="form-group">

                        <label className="col-sm-3 control-label">Min:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...min_crystal_vdim} />
                        </div>

                        <label className="col-sm-3 control-label">Max:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...max_crystal_vdim} />
                        </div>

                        <label className="col-sm-3 control-label">  &omega; at min:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...min_crystal_vphi} />
                        </div>

                        <label className="col-sm-3 control-label">  &omega; at max:</label>
                        <div className="col-sm-3">
                            <input type="number" className="form-control" {...max_crystal_vphi} />
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

Characterisation = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'characterisation',                           // a unique name for this form
  fields: ['num_images', 'exp_time', 'resolution', 'osc_start' , 'energy', 'osc_range', 'transmission', 'centringMethod', 'detector_mode', 'kappa', 'kappa_phi', 'account_rad_damage' , 'opt_sad', 'space_group', 'min_crystal_vdim', 'max_crystal_vdim', 'min_crystal_vphi', 'max_crystal_vphi', 'strategy_complexity' ] // all the fields in your form
},
state => ({ // mapStateToProps
  initialValues: {...state.taskForm.taskData.parameters} // will pull state into form's initialValues
}))(Characterisation);

export default Characterisation;