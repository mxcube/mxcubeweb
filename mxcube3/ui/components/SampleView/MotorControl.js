import React from 'react';
import { Button } from 'react-bootstrap';

import MotorInput from './MotorInput';
import TwoAxisTranslationControl from './TwoAxisTranslationControl';

import './motor.css';

export default class MotorControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showAll: false };
  }

  horVerTranslationAvailable() {
    return this.props.motors.sample_vertical.state !== 0 &&
      this.props.motors.sample_horizontal.state !== 0;
  }

  renderAllMotors() {
    const {
      phiy,
      phiz,
      focus,
      sampx,
      sampy } = this.props.motors;
    const {
      phiyStep,
      phizStep,
      focusStep,
      sampxStep,
      sampyStep
    } = this.props.steps;

    const save = this.props.save;
    const saveStep = this.props.saveStep;
    const stop = this.props.stop;

    return (
      <div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={focus.position}
            saveStep={saveStep}
            step={focusStep}
            motorName="Focus"
            label="X:"
            suffix="mm"
            decimalPoints="3"
            state={focus.state}
            stop={stop}
            disabled={this.props.motorsDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={phiy.position}
            saveStep={saveStep}
            step={phiyStep}
            motorName="PhiY"
            label="Y:"
            suffix="mm"
            decimalPoints="3"
            state={phiy.state}
            stop={stop}
            disabled={this.props.motorsDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={phiz.position}
            saveStep={saveStep}
            step={phizStep}
            motorName="PhiZ"
            label="Z:"
            suffix="mm"
            decimalPoints="3"
            state={phiz.state}
            stop={stop}
            disabled={this.props.motorsDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={sampx.position}
            saveStep={saveStep}
            step={sampxStep}
            motorName="SampX"
            label="Samp-X:"
            suffix="mm"
            decimalPoints="3"
            state={sampx.state}
            stop={stop}
            disabled={this.props.motorsDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={sampy.position}
            saveStep={saveStep}
            step={sampyStep}
            motorName="SampY"
            label="Samp-Y:"
            suffix="mm"
            decimalPoints="3"
            state={sampy.state}
            stop={stop}
            disabled={this.props.motorsDisabled}
          />
        </div>
      </div>
    );
  }

  renderTranslationCross() {
    const save = this.props.save;
    const saveStep = this.props.saveStep;
    const stop = this.props.stop;

    return (
      <div>
        <div style={{ marginLeft: '15px' }}>
          <TwoAxisTranslationControl
            save={save}
            saveStep={saveStep}
            motors={this.props.motors}
            motorsDisabled={ this.props.motorsDisabled}
            steps={this.props.steps}
            stop={stop}
          />
        </div>
        { this.state.showAll ?
          <div>
            { this.renderAllMotors() }
            <Button
              style={{ marginLeft: '8px', width: '145px' }}
              onClick={() => {this.setState({ showAll: false });}}
            >
              <i className="fa fa-cogs" /> Hide motors<i className="fa fa-caret-up" />
            </Button>
          </div>
          :
          <Button
            style={{ marginTop: '1em', marginLeft: '8px', width: '145px' }}
            onClick={() => {this.setState({ showAll: true });}}
          >
            <i className="fa fa-cogs" /> Show motors<i className="fa fa-caret-down" />
          </Button>
        }
      </div>
    );
  }

  render() {
    const {
      phi,
      kappa,
      kappa_phi } = this.props.motors;
    const {
      phiStep,
      kappaStep,
      kappaphiStep
    } = this.props.steps;

    const save = this.props.save;
    const saveStep = this.props.saveStep;
    const stop = this.props.stop;

    return (
           <div className="row">
            <div className="col-sm-12">
              <MotorInput
                save={save}
                saveStep={saveStep}
                step={phiStep}
                value={phi.position}
                motorName="Phi"
                label="Omega:"
                suffix="&deg;"
                decimalPoints="2"
                state={phi.state}
                stop={stop}
                disabled={this.props.motorsDisabled}
              />
            </div>

            <div className="col-sm-12">
              <MotorInput
                save={save}
                saveStep={saveStep}
                step={kappaStep}
                value={kappa.position}
                motorName="Kappa"
                label="Kappa:"
                suffix="&deg;"
                decimalPoints="2"
                state={kappa.state}
                stop={stop}
                disabled={this.props.motorsDisabled}
              />
            </div>

            <div className="col-sm-12">
              <MotorInput
                save={save}
                saveStep={saveStep}
                step={kappaphiStep}
                value={kappa_phi.position}
                motorName="Kappa_phi"
                label="Phi:"
                suffix="&deg;"
                decimalPoints="2"
                state={kappa_phi.state}
                stop={stop}
                disabled={this.props.motorsDisabled}
              />
            </div>
            { this.horVerTranslationAvailable() ?
              this.renderTranslationCross() : this.renderAllMotors()
            }
           </div>);
  }
}
