import React from 'react'
import {reduxForm} from 'redux-form';
import { Modal } from "react-bootstrap";


class DataCollection extends React.Component {

    constructor(props) {
        super(props);
        this.state =  {};
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        // this is to prevent infinite recursion, caused by calling initializeForm
        // which makes componentWillReceiveProps to be called again
        if (nextProps.clicked_task === this.state.clicked_task) { return }
        
        if (Object.keys(nextProps.clicked_task).length > 0) {
            this.props.initializeForm(nextProps.clicked_task.parameters);
        }

        this.setState({ clicked_task: nextProps.clicked_task });
    }

    _change() {
        return Object.keys(this.props.clicked_task).length > 0;
    }

    handleSubmit(){
        let parameters = Object.assign({Type: "DataCollection"}, this.props.values);
        
        if (this._change()) {
            this.props.changeTask(parameters);
        //}else if(this.props.point){
        //    (this.props.lookup[this.props.current] ? this.props.addTask(this.props.current, this.props.lookup[this.props.current],parameters): '');
        }else{
            Object.keys(this.props.selected).forEach((sample_id) => {
                let selected = this.props.selected[sample_id];
                if (selected) {
                    let queue_id = this.props.lookup[sample_id];
                    if (queue_id) {
                        this.props.addTask(queue_id, sample_id, parameters);
                    } else {
                        // the sample is not in queue yet
                        this.props.addSampleAndTask(sample_id, parameters);
                    }                    
                }
            });
        }
        
        this.props.hide();
    }


    render() {
        var {num_images, exp_time, resolution, osc_start , energy, osc_range, transmission} = this.props.fields; 
 
        return (<Modal animation={false} show={this.props.show} onHide={this.props.hide}>
          <Modal.Header closeButton>
            <Modal.Title>Data Collection</Modal.Title>
          </Modal.Header>
          <Modal.Body>
        <form className="form-horizontal">

            <div className="form-group">

                <label className="col-sm-3 control-label">Number of images</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...num_images} />
                </div>

                 <label className="col-sm-3 control-label">Exposure time</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...exp_time} />
                </div>


            </div>


            <div className="form-group">

                <label className="col-sm-3 control-label">Resolution (A)</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...resolution} />
                </div>

                <label className="col-sm-3 control-label">Oscillation start</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...osc_start} />
                </div>


            </div>


            <div className="form-group">

                <label className="col-sm-3 control-label">Energy (KeV)</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...energy} />
                </div>

                <label className="col-sm-3 control-label">Oscillation range</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...osc_range} />
                </div>

            </div>


            <div className="form-group">

                <label className="col-sm-3 control-label">Transmission (%)</label>
                <div className="col-sm-9">
                    <input type="number" className="form-control" {...transmission} />
                </div>

            </div>

        </form>
        </Modal.Body>
        <Modal.Footer>
              <button type="button" className="btn btn-default" onClick={this.props.hide}>Close</button>
              <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>{this._change() ? "Change parameters": "Add"}</button>
        </Modal.Footer>
        </Modal>);
    }
}

DataCollection = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'data_collection',                           // a unique name for this form
  fields: ['num_images', 'exp_time', 'resolution', 'osc_start' , 'energy', 'osc_range', 'transmission'] // all the fields in your form
})(DataCollection);

export default DataCollection;
