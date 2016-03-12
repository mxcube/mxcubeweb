'use strict';

import React from 'react'
import {reduxForm} from 'redux-form';

class MotorControl extends React.Component {


  constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
  }

    componentWillMount(){
      const motors = this.props.motors;
       this.props.initializeForm({
                Phi: motors.Phi.position, 
                PhiY: motors.PhiY.position, 
                PhiZ: motors.PhiZ.position, 
                Sampx: motors.Sampx.position, 
                Sampy: motors.Sampy.position,
                Zoom: motors.Zoom.position
        });
    }

    handleSubmit(){
      const fields = this.props.fields;
      for(let id in fields){
        if(fields[id].dirty){
          this.props.sampleActions.sendMotorPosition(id, fields[id].value);
        }
      }
    }

    render() { 

        const {fields: {Kappa, Kappa_phi, Phi, PhiY, PhiZ, Sampx, Sampy, Zoom}} = this.props;

        return (
       
        <div className="information-box"><h2 className="text-center">Motors</h2>
        <hr className="divider" />

        <form className="form-horizontal">

            <div className="form-group motor-group">

                <label className="col-sm-2 control-label">Kappa</label>
                <div className="col-sm-4">
                    <input type="number" className="form-control" {...Kappa} />
                </div>

                 <label className="col-sm-2 control-label">Kappa_Phi</label>
                <div className="col-sm-4">
                    <input type="number" className="form-control" {...Kappa_phi} />
                </div>


            </div>
            <div className="form-group motor-group">

                <label className="col-sm-2 control-label">Phi</label>
                <div className="col-sm-4">
                    <input type="number" className="form-control" {...Phi} />
                </div>

                 <label className="col-sm-2 control-label">PhiY</label>
                <div className="col-sm-4">
                    <input type="number" className="form-control" {...PhiY} />
                </div>


            </div>

            <div className="form-group motor-group">

                <label className="col-sm-2 control-label">PhiZ</label>
                <div className="col-sm-4">
                    <input type="number" className="form-control" {...PhiZ} />
                </div>

                 <label className="col-sm-2 control-label">SampX</label>
                <div className="col-sm-4">
                    <input type="number" className="form-control" {...Sampx} />
                </div>


            </div>

             <div className="form-group motor-group">

                <label className="col-sm-2 control-label">SampY</label>
                <div className="col-sm-4">
                    <input type="number" className="form-control" {...Sampy} />
                </div>

                <label className="col-sm-2 control-label">Zoom</label>
                 <div className="col-sm-4">
                    <input type="number" className="form-control" {...Zoom} />
                </div>

            </div>
        </form>

          <button type="button" className="btn btn-primary pull-right motor-button" onClick={this.handleSubmit}>Change Motors</button>
        </div>

        );
    }
}

MotorControl = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'MotorControl',                           // a unique name for this form
  fields: ['Kappa', 'Kappa_phi', 'Phi', 'PhiY', 'PhiZ', 'Sampx', 'Sampy', 'Zoom'] // all the fields in your form
})(MotorControl);

export default MotorControl;

