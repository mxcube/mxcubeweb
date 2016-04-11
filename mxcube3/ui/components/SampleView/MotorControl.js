
'use strict';

import React from 'react';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Overlay } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import {reduxForm} from 'redux-form';

const ToolTip = props => {
  let {
    style,
    title,
    children
  } = props;

  return (
    <div className="overlay-box" style={{ ...style}}>
      <div className="overlay-arrow"/>
        <div className="overlay-head">
            {title}
        </div>
        <div className="overlay-body">
            {children}
        </div>
    </div>
  );
};


class MotorControl extends React.Component {


  constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
  }

    componentDidMount() {
        this.phiTarget = ReactDOM.findDOMNode.bind(this, this.refs.target);
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
        const {fields: {Kappa, Kappa_phi, Phi, PhiY, PhiZ}} = this.props;
        return (
       
        <div className="sample-controlls sample-controlls-top">

                <div className="row">

                <div className="col-sm-2">
                    <label className="motor-name">Kappa: </label>
                    <span className="motor-value">{String(Kappa.value).substring(0,4)}</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Kappa_phi: </label>
                    <span className="motor-value">{String(Kappa_phi.value).substring(0,4)}</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Phi: </label>
                    <span className="motor-value" ref='target'>{String(Phi.value).substring(0,4)}</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">PhiY: </label>
                    <span className="motor-value">{String(PhiY.value).substring(0,4)}</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">PhiZ: </label>
                    <span className="motor-value">{String(PhiZ.value).substring(0,4)}</span>
                </div>

                <Overlay
                    show
                    placement={"bottom"}
                    container={this}
                    target={this.phiTarget}
                >
                    <ToolTip title={"Phi"}>
                    <div className="form-inline">
                      <div className="form-group">
                        <input className="form-control input-sm" type="number" step="15" {...Phi}/>
                        <button className="btn btn-primary btn-sm editable-submit" onClick={this.handleSubmit}>Go!</button>
                        <select className="form-control input-sm">
                            <option value="15">15</option>
                            <option value="30">30</option>
                            <option value="45">45</option>
                            <option value="90">90</option>
                            <option value="180">180</option>
                        </select>
                      </div>
                    </div>
                    </ToolTip>
                </Overlay>

                </div>
        </div>

        );
    }
}

MotorControl = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'MotorControl',                           // a unique name for this form
  fields: ['Kappa', 'Kappa_phi', 'Phi', 'PhiY', 'PhiZ'] // all the fields in your form
},
state => ({ // mapStateToProps
  initialValues: {
      Phi : state.sampleview.motors.Phi.position, 
      PhiY : state.sampleview.motors.PhiY.position,
      PhiZ : state.sampleview.motors.PhiZ.position
  } // will pull state into form's initialValues
}))(MotorControl);

export default MotorControl;

