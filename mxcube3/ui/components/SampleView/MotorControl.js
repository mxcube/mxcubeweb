import React from 'react';
import MotorInput from './MotorInput';
import './motor.css';

export default class MotorControl extends React.Component {

  render() {
    const { phi, phiy, phiz, focus, sampx, sampy, kappa, kappa_phi } = this.props.motors;
    const {
      phiStep,
      phiyStep,
      phizStep,
      focusStep,
      sampxStep,
      sampyStep,
      kappaStep,
      kappaphiStep
    } = this.props.steps;
    const save = this.props.save;
    const saveStep = this.props.saveStep;
    const stop = this.props.stop;

    return (

          <div className="row">

              <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Omega: </p>
                  <MotorInput
                    save={save}
                    saveStep={saveStep}
                    step={phiStep}
                    value={phi.position}
                    motorName="Phi"
                    suffix="&deg;"
                    decimalPoints="2"
                    state={phi.Status}
                    stop={stop}
                  />
              </div>

              <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Kappa: </p>
                  <MotorInput
                    save={save}
                    saveStep={saveStep}
                    step={kappaStep}
                    value={kappa.position}
                    motorName="Kappa"
                    suffix="&deg;"
                    decimalPoints="2"
                    state={kappa.Status}
                    stop={stop}
                  />
              </div>

              <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Phi: </p>
                  <MotorInput
                    save={save}
                    saveStep={saveStep}
                    step={kappaphiStep}
                    value={kappa_phi.position}
                    motorName="Kappa_phi"
                    suffix="&deg;"
                    decimalPoints="2"
                    state={kappa_phi.Status}
                    stop={stop}
                  />
              </div>

              <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Y: </p>
                  <MotorInput
                    save={save}
                    value={phiy.position}
                    saveStep={saveStep}
                    step={phiyStep}
                    motorName="PhiY"
                    suffix="mm"
                    decimalPoints="2"
                    state={phiy.Status}
                    stop={stop}
                  />
              </div>

              <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Z: </p>
                  <MotorInput
                    save={save}
                    value={phiz.position}
                    saveStep={saveStep}
                    step={phizStep}
                    motorName="PhiZ"
                    suffix="mm"
                    decimalPoints="2"
                    state={phiz.Status}
                    stop={stop}
                  />
              </div>

             <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Focus: </p>
                  <MotorInput
                    save={save}
                    value={focus.position}
                    saveStep={saveStep}
                    step={focusStep}
                    motorName="Focus"
                    suffix="mm"
                    decimalPoints="2"
                    state={focus.Status}
                    stop={stop}
                  />
              </div>

              <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Samp-X: </p>
                  <MotorInput
                    save={save}
                    value={sampx.position}
                    saveStep={saveStep}
                    step={sampxStep}
                    motorName="SampX"
                    suffix="mm"
                    decimalPoints="2"
                    state={sampx.Status}
                    stop={stop}
                  />
              </div>

             <div className="col-sm-12 motor-input-container">
                  <p className="motor-name">Samp-Y: </p>
                  <MotorInput
                    save={save}
                    value={sampy.position}
                    saveStep={saveStep}
                    step={sampyStep}
                    motorName="SampY"
                    suffix="mm"
                    decimalPoints="2"
                    state={sampy.Status}
                    stop={stop}
                  />
              </div>

          </div>

      );
  }
}
