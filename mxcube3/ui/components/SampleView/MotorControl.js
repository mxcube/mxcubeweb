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
    return this.props.movables.sample_vertical.state !== 0 &&
      this.props.movables.sample_horizontal.state !== 0;
  }

  renderAllMotors() {
    const {
      phiy,
      phiz,
      focus,
      sampx,
      sampy } = this.props.movables;
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
            value={focus.value}
            saveStep={saveStep}
            step={focusStep}
            motorName="Focus"
            label="X:"
            suffix="mm"
            decimalPoints="3"
            state={focus.state}
            stop={stop}
            disabled={this.props.movablesDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={phiy.value}
            saveStep={saveStep}
            step={phiyStep}
            motorName="PhiY"
            label="Y:"
            suffix="mm"
            decimalPoints="3"
            state={phiy.state}
            stop={stop}
            disabled={this.props.movablesDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={phiz.value}
            saveStep={saveStep}
            step={phizStep}
            motorName="PhiZ"
            label="Z:"
            suffix="mm"
            decimalPoints="3"
            state={phiz.state}
            stop={stop}
            disabled={this.props.movablesDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={sampx.value}
            saveStep={saveStep}
            step={sampxStep}
            motorName="SampX"
            label="Samp-X:"
            suffix="mm"
            decimalPoints="3"
            state={sampx.state}
            stop={stop}
            disabled={this.props.movablesDisabled}
          />
        </div>
        <div className="col-sm-12">
          <MotorInput
            save={save}
            value={sampy.value}
            saveStep={saveStep}
            step={sampyStep}
            motorName="SampY"
            label="Samp-Y:"
            suffix="mm"
            decimalPoints="3"
            state={sampy.state}
            stop={stop}
            disabled={this.props.movablesDisabled}
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
            movables={this.props.movables}
            movablesDisabled={ this.props.movablesDisabled}
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
              <i className="fa fa-cogs" /> Hide movables<i className="fa fa-caret-up" />
            </Button>
          </div>
          :
          <Button
            style={{ marginTop: '1em', marginLeft: '8px', width: '145px' }}
            onClick={() => {this.setState({ showAll: true });}}
          >
            <i className="fa fa-cogs" /> Show movables<i className="fa fa-caret-down" />
          </Button>
        }
      </div>
    );
  }

  render() {
    const {
      phi,
      kappa,
      kappa_phi } = this.props.movables;
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
                value={phi.value}
                motorName="Phi"
                label="Omega:"
                suffix="&deg;"
                decimalPoints="2"
                state={phi.state}
                stop={stop}
                disabled={this.props.movablesDisabled}
              />
            </div>

            <div className="col-sm-12">
              <MotorInput
                save={save}
                saveStep={saveStep}
                step={kappaStep}
                value={kappa.value}
                motorName="Kappa"
                label="Kappa:"
                suffix="&deg;"
                decimalPoints="2"
                state={kappa.state}
                stop={stop}
                disabled={this.props.movablesDisabled}
              />
            </div>

            <div className="col-sm-12">
              <MotorInput
                save={save}
                saveStep={saveStep}
                step={kappaphiStep}
                value={kappa_phi.value}
                motorName="Kappa_phi"
                label="Phi:"
                suffix="&deg;"
                decimalPoints="2"
                state={kappa_phi.state}
                stop={stop}
                disabled={this.props.movablesDisabled}
              />
            </div>
            { this.horVerTranslationAvailable() ?
              this.renderTranslationCross() : this.renderAllMotors()
            }
           </div>);
  }
}
