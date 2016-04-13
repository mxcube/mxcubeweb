
'use strict';

import React from 'react';
import "bootstrap-webpack!bootstrap-webpack/bootstrap.config.js";
import { OverlayTrigger, Popover } from 'react-bootstrap';

class MotorControl extends React.Component {


  constructor(props) {
        super(props);
        this.handleType = this.handleType.bind(this);
        this.handleClick = this.handleClick.bind(this);

  }

    handleType(e){
        e.preventDefault(); // Let's stop this event.
        e.stopPropagation(); // Really this time.
        if([13,38,40].includes(e.keyCode)){
            this.props.sampleActions.sendMotorPosition(e.target.name, e.target.valueAsNumber);
        }
    }

    handleClick(e){
        this.props.sampleActions.sendMotorPosition(e.target.name, e.target.valueAsNumber);
    }

    render() { 
        const motors = this.props.motors;
        const Phi = motors.Phi.position.toFixed(2);
        const PhiY = motors.PhiY.position.toFixed(2);
        const PhiZ = motors.PhiZ.position.toFixed(2);
        const Focus = motors.Focus.position.toFixed(2);

        return (
       
        <div className="sample-controlls sample-controlls-top">

                <div className="row">

                <div className="col-sm-2">
                    <label className="motor-name">Omega: </label>
                    <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={
                        <Popover id="Omega" title="Omega">
                            <div className="form-inline">
                                <div className="form-group">
                                    <form onSubmit={this.handleType} noValidate>
                                        <input className="form-control input-sm" title="asdas" onKeyUp={this.handleType} onClick={this.handleClick} type="number" step="90" defaultValue={Phi} name="Phi"/>
                                    </form>
                                </div>
                            </div>
                        </Popover>
                        }
                    >
                        <span className="motor-value">{Phi}&deg;</span>
                    </OverlayTrigger>
                </div>



                <div className="col-sm-2">
                    <label className="motor-name">Kappa: </label>
                    <span className="motor-value">NA</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Phi: </label>
                    <span className="motor-value">NA</span>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Y: </label>
                    <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={
                        <Popover id="Y" title="Y">
                            <div className="form-inline">
                                <div className="form-group">
                                    <form onSubmit={this.handleType} noValidate>
                                        <input className="form-control input-sm" onKeyUp={this.handleType} onClick={this.handleClick} type="number" step="0.1" defaultValue={PhiY} name="PhiY"/>
                                    </form>
                                </div>
                            </div>
                        </Popover>
                        }
                    >
                        <span className="motor-value">{PhiY}</span>
                    </OverlayTrigger>
                </div>


                <div className="col-sm-2">
                    <label className="motor-name">Z: </label>
                    <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={
                        <Popover id="Z" title="Z">
                            <div className="form-inline">
                                <div className="form-group">
                                    <form onSubmit={this.handleType} noValidate>
                                        <input className="form-control input-sm" onKeyUp={this.handleType} onClick={this.handleClick} type="number" step="0.1" defaultValue={PhiZ} name="PhiZ"/>
                                    </form>
                                </div>
                            </div>
                        </Popover>
                        }
                    >
                        <span className="motor-value">{PhiZ}</span>
                    </OverlayTrigger>
                </div>

               <div className="col-sm-2">
                    <label className="motor-name">Focus: </label>
                    <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={
                        <Popover id="Focus" title="Focus">
                            <div className="form-inline">
                                <div className="form-group">
                                    <form onSubmit={this.handleType} noValidate>
                                        <input className="form-control input-sm" onKeyUp={this.handleType} onClick={this.handleClick} type="number" step="0.1" defaultValue={Focus} name="Focus"/>
                                    </form>
                                </div>
                            </div>
                        </Popover>
                        }
                    >
                        <span className="motor-value">{Focus}</span>
                    </OverlayTrigger>
                </div>

                </div>
        </div>

        );
    }
}

export default MotorControl;

