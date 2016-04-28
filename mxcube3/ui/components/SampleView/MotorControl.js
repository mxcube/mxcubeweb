
'use strict';
import React from 'react';
import MotorInput from './MotorInput';

class MotorControl extends React.Component {

    render() { 
        const {Phi, PhiY, PhiZ, Focus} = this.props.motors;
        const save = this.props.save;

        return (
       
        <div className="sample-controlls sample-controlls-top">

            <div className="row">

                <div className="col-sm-2">
                    <label className="motor-name">Omega: </label>
                    <MotorInput 
                        title="Omega" 
                        save={save} 
                        value={Phi.position} 
                        motorName="Phi" 
                        step="90" 
                        suffix="&deg;"
                        decimalPoints="2"
                    />
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Kappa: </label>
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Phi: </label>

                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Y: </label>
                    <MotorInput 
                        title="Y" 
                        save={save} 
                        value={PhiY.position} 
                        motorName="PhiY" 
                        step="0.1" 
                        suffix="mm"
                        decimalPoints="2"
                    />                    
                </div>

                <div className="col-sm-2">
                    <label className="motor-name">Z: </label>
                    <MotorInput 
                        title="Z" 
                        save={save} 
                        value={PhiZ.position} 
                        motorName="PhiZ" 
                        step="0.1" 
                        suffix="mm"
                        decimalPoints="2"
                    />   
                </div>

               <div className="col-sm-2">
                    <label className="motor-name">Focus: </label>
                    <MotorInput 
                        title="Focus" 
                        save={save} 
                        value={Focus.position} 
                        motorName="Focus" 
                        step="0.1" 
                        suffix="mm"
                        decimalPoints="2"
                    />                    
                </div>

            </div>

        </div>

        );
    }
}

export default MotorControl;

