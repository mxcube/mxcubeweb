
import React from 'react';
import MotorInput from './MotorInput';

export default class MotorControl extends React.Component {

    render() {
        const { Phi, PhiY, PhiZ, Focus, Sampx, Sampy } = this.props.motors;
        const { PhiStep, PhiYStep, PhiZStep, FocusStep, SampXStep, SampYStep } = this.props.steps;
        const save = this.props.save;
        const saveStep = this.props.saveStep;
        const stop = this.props.stop;

        return (

            <div className="row">

                <div className="col-sm-12">
                    <p className="motor-name">Omega: </p>
                    <MotorInput
                      save={save}
                      saveStep={saveStep}
                      step={PhiStep}
                      value={Phi.position}
                      motorName="Phi"
                      suffix="&deg;"
                      decimalPoints="2"
                      state={Phi.Status}
                      stop={stop}
                    />
                </div>

                <div className="col-sm-12">
                    <p className="motor-name">Kappa: </p>
                    <MotorInput
                      save={save}
                      saveStep={saveStep}
                      step="0.1"
                      value={0}
                      motorName="Kappa"
                      suffix="&deg;"
                      decimalPoints="2"
                      state="3"
                      stop={stop}
                    />
                </div>

                <div className="col-sm-12">
                    <p className="motor-name">Phi: </p>
                    <MotorInput
                      save={save}
                      saveStep={saveStep}
                      step="0.1"
                      value={0}
                      motorName="Phi"
                      suffix="&deg;"
                      decimalPoints="2"
                      state="3"
                      stop={stop}
                    />
                </div>

                <div className="col-sm-12">
                    <p className="motor-name">Y: </p>
                    <MotorInput
                      save={save}
                      value={PhiY.position}
                      saveStep={saveStep}
                      step={PhiYStep}
                      motorName="PhiY"
                      suffix="&deg;"
                      decimalPoints="2"
                      state={PhiY.Status}
                      stop={stop}
                    />
                </div>

                <div className="col-sm-12">
                    <p className="motor-name">Z: </p>
                    <MotorInput
                      save={save}
                      value={PhiZ.position}
                      saveStep={saveStep}
                      step={PhiZStep}
                      motorName="PhiZ"
                      suffix="&deg;"
                      decimalPoints="2"
                      state={PhiZ.Status}
                      stop={stop}
                    />
                </div>

               <div className="col-sm-12">
                    <p className="motor-name">Focus: </p>
                    <MotorInput
                      save={save}
                      value={Focus.position}
                      saveStep={saveStep}
                      step={FocusStep}
                      motorName="Focus"
                      suffix="&deg;"
                      decimalPoints="2"
                      state={Focus.Status}
                      stop={stop}
                    />
                </div>

                <div className="col-sm-12">
                    <p className="motor-name">SampX: </p>
                    <MotorInput
                      save={save}
                      value={Sampx.position}
                      saveStep={saveStep}
                      step={SampXStep}
                      motorName="SampX"
                      suffix="&deg;"
                      decimalPoints="2"
                      state={Sampx.Status}
                      stop={stop}
                    />
                </div>

               <div className="col-sm-12">
                    <p className="motor-name">SampY: </p>
                    <MotorInput
                      save={save}
                      value={Sampy.position}
                      saveStep={saveStep}
                      step={SampYStep}
                      motorName="SampY"
                      suffix="&deg;"
                      decimalPoints="2"
                      state={Sampy.Status}
                      stop={stop}
                    />
                </div>

            </div>

        );
    }
}
