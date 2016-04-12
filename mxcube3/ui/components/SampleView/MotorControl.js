
'use strict';

import React from 'react';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { Overlay } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import {reduxForm} from 'redux-form';
import PopOver from './PopOver'


class MotorControl extends React.Component {


  constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.closePopOver = props.showPopOver.bind(this, '');
        this.showPhi = props.showPopOver.bind(this, 'Phi');
        this.showPhiY = props.showPopOver.bind(this, 'PhiY');
        this.showPhiZ = props.showPopOver.bind(this, 'PhiZ');
  }

    componentDidMount() {
        this.phiTarget = ReactDOM.findDOMNode.bind(this, this.refs.phi);
        this.phiYTarget = ReactDOM.findDOMNode.bind(this, this.refs.phiY);
        this.phiZTarget = ReactDOM.findDOMNode.bind(this, this.refs.phiZ);

    }

    handleSubmit(){
      const fields = this.props.fields;
      this.closePopOver();
      for(let id in fields){
        if(fields[id].dirty){
          this.props.sampleActions.sendMotorPosition(id, parseFloat(fields[id].value));
        }
      }
    }

    render() { 
        const {fields: {Kappa, Kappa_phi, Phi, PhiStep, PhiY, PhiZ}} = this.props;
        return (
       
        <div className="sample-controlls sample-controlls-top">

                <div className="row">

                <div className="col-sm-2">
                    <label className="motor-name">Kappa: </label>
                    <span className="motor-value">{Kappa.value}</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Kappa_phi: </label>
                    <span className="motor-value">{Kappa_phi.value}</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Phi: </label>
                    <span className="motor-value" ref='phi' onClick={this.showPhi}>{Phi.value}&deg;</span>

                    <Overlay
                        show={this.props.popOver === "Phi"}
                        placement={"bottom"}
                        container={this}
                        target={this.phiTarget}
                    >
                      <PopOver title={"Phi"} closePopOver={this.closePopOver}>
                        <div className="form-inline">
                          <div className="form-group">
                          <input className="form-control input-sm" type="number" step={PhiStep.value} {...Phi}/>
                          <button className="btn btn-primary btn-sm editable-submit" onClick={this.handleSubmit}>Go</button>
                          <select className="form-control input-sm" {...PhiStep}>
                            <option value="1.0">1</option>
                            <option value="15.0">15</option>
                            <option value="30.0">30</option>
                            <option value="45.0">45</option>
                            <option value="90.0">90</option>
                            <option value="180.0">180</option>
                          </select>
                      </div>
                    </div>
                    </PopOver>
                </Overlay>



                </div>

                <div className="col-sm-2">
                    <label className="motor-name">PhiY: </label>
                    <span className="motor-value" ref='phiY'  onClick={this.showPhiY}>{PhiY.value}&deg;</span>
                    <Overlay
                        show={this.props.popOver === "PhiY"}
                        placement={"bottom"}
                        container={this}
                        target={this.phiYTarget}
                    >
                      <PopOver title="PhiY" closePopOver={this.closePopOver}>
                        <div className="form-inline">
                          <div className="form-group">
                          <input className="form-control input-sm" type="number" step="0.1" {...PhiY}/>
                          <button className="btn btn-primary btn-sm editable-submit" onClick={this.handleSubmit}>Go</button>
                      </div>
                    </div>
                    </PopOver>
                </Overlay>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">PhiZ: </label>
                    <span className="motor-value" ref='phiZ'  onClick={this.showPhiZ}>{PhiZ.value}&deg;</span>
                    <Overlay
                        show={this.props.popOver === "PhiZ"}
                        placement={"bottom"}
                        container={this}
                        target={this.phiZTarget}
                    >
                      <PopOver title="PhiY" closePopOver={this.closePopOver}>
                        <div className="form-inline">
                          <div className="form-group">
                          <input className="form-control input-sm" type="number" step="0.1" {...PhiZ}/>
                          <button className="btn btn-primary btn-sm editable-submit" onClick={this.handleSubmit}>Go</button>
                      </div>
                    </div>
                    </PopOver>
                </Overlay>
                </div>

                </div>
        </div>

        );
    }
}

MotorControl = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'motorControl',                           // a unique name for this form
  fields: ['Kappa', 'Kappa_phi', 'Phi', 'PhiStep', 'PhiY', 'PhiZ'] // all the fields in your form
},
state => ({ // mapStateToProps
  initialValues: {
      Phi : state.sampleview.motors.Phi.position.toFixed(2), 
      PhiY : state.sampleview.motors.PhiY.position.toFixed(2),
      PhiZ : state.sampleview.motors.PhiZ.position.toFixed(2)
    } // will pull state into form's initialValues
}))(MotorControl);

export default MotorControl;

