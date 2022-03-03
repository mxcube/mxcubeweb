import React from 'react';
import { Button } from 'react-bootstrap';
import MotorInput from '../MotorInput/MotorInput';
import TwoAxisTranslationControl from '../MotorInput/TwoAxisTranslationControl';
import PhaseInput from './PhaseInput';
import { find } from 'lodash';

import '../MotorInput/motor.css';

export default class MotorControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showAll: false };
  }

  getMotorComponents(from, to) {
    const { save } = this.props;
    const { saveStep } = this.props;
    const _stop = this.props.stop;

    const to_arg = to !== null ? to : this.props.uiproperties.components.length;

    const motor_components = Object.values(this.props.uiproperties.components)
      .slice(from, to_arg)
      .map((motor_uiprop) => {
        const motor = this.props.attributes[motor_uiprop.attribute];
        return (
          <div className="col-sm-12">
            <MotorInput
              save={save}
              saveStep={saveStep}
              step={motor_uiprop.step}
              value={motor.value}
              motorName={motor_uiprop.attribute}
              label={`${motor_uiprop.label}:`}
              suffix={motor_uiprop.suffix}
              decimalPoints={motor_uiprop.precision}
              state={motor.state}
              stop={_stop}
              disabled={this.props.motorsDisabled}
            />
          </div>
        );
      });

    return motor_components;
  }

  horVerTranslationAvailable() {
    const sample_vertical_uiprop = find(this.props.uiproperties.components, {
      role: 'sample_vertical',
    });

    const sample_horizontal_uiprop = find(this.props.uiproperties.components, {
      role: 'sample_vertical',
    });

    const sample_vertical =
      this.props.attributes[sample_vertical_uiprop.attribute];
    const sample_horizontal =
      this.props.attributes[sample_horizontal_uiprop.attribute];

    return sample_vertical !== undefined && sample_horizontal !== undefined;
  }

  renderAllMotors() {
    const phaseControl = (
      <div>
        <p className="motor-name">Phase Control:</p>
        <PhaseInput
          phase={this.props.sampleViewState.currentPhase}
          phaseList={this.props.sampleViewState.phaseList}
          sendPhase={this.props.sampleViewActions.sendCurrentPhase}
        />
      </div>
    );

    return (
      <div>
        {this.getMotorComponents(3, 8)}
        <div className="col-sm-12">
          {process.env.phaseControl ? phaseControl : null}
        </div>
      </div>
    );
  }

  renderTranslationCross() {
    const { save } = this.props;
    const { saveStep } = this.props;
    const _stop = this.props.stop;

    const sample_vertical_uiprop = find(this.props.uiproperties.components, {
      role: 'sample_vertical',
    });

    const sample_horizontal_uiprop = find(this.props.uiproperties.components, {
      role: 'sample_horizontal',
    });

    const sample_vertical =
      this.props.attributes[sample_vertical_uiprop.attribute];
    const sample_horizontal =
      this.props.attributes[sample_horizontal_uiprop.attribute];

    const motors = {
      sample_vertical: Object.assign(sample_vertical_uiprop, sample_vertical),
      sample_horizontal: Object.assign(
        sample_horizontal_uiprop,
        sample_horizontal
      ),
    };

    return (
      <div>
        <div style={{ marginLeft: '15px' }}>
          <TwoAxisTranslationControl
            save={save}
            saveStep={saveStep}
            motors={motors}
            motorsDisabled={this.props.motorsDisabled}
            steps={this.props.steps}
            stop={_stop}
          />
        </div>
        {this.state.showAll ? (
          <div>
            <Button
              style={{ marginTop: '1em', marginLeft: '8px', width: '145px' }}
              onClick={() => {
                this.setState({ showAll: false });
              }}
            >
              <i className="fas fa-cogs" /> Hide motors
              <i className="fas fa-caret-up" />
            </Button>
            {this.renderAllMotors()}
          </div>
        ) : (
          <Button
            style={{ marginTop: '1em', marginLeft: '8px', width: '145px' }}
            onClick={() => {
              this.setState({ showAll: true });
            }}
          >
            <i className="fas fa-cogs" /> Show motors
            <i className="fas fa-caret-down" />
          </Button>
        )}
      </div>
    );
  }

  render() {
    return (
      <div className="row">
        {this.getMotorComponents(0, 3)}
        {this.horVerTranslationAvailable()
          ? this.renderTranslationCross()
          : this.renderAllMotors()}
      </div>
    );
  }
}
