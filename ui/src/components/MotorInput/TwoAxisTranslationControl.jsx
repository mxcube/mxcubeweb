import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { MOTOR_STATE } from '../../constants';
import MotorInput from './MotorInput';
import './motor.css';

export default class TwoAxisTranslationControl extends React.Component {

  constructor(props) {
    super(props);
    this.stepChange = this.stepChange.bind(this);
  }

  stepChange(name, step, operator) {
    const value = this.props.motors[name].value;
    const newValue = value + step * operator;
    this.props.save(this.props.motors[name].attribute, newValue);
  }

  renderMotorSettings() {
    return (
        <Popover className='p-3' style={{ maxWidth: 'fit-content' }} title='Sample alignment motors'>
          <div className=''>
            <MotorInput
              save={this.props.save}
              value={this.props.motors.sample_vertical.value}
              saveStep={this.props.saveStep}
              step={this.props.motors.sample_vertical.step}
              motorName={this.props.motors.sample_vertical.attribute}
              label={this.props.motors.sample_vertical.label}
              suffix={this.props.motors.sample_vertical.suffix}
              decimalPoints={this.props.motors.sample_vertical.precision}
              state={this.props.motors.sample_vertical.state}
              stop={this.props.stop}
              disabled={this.props.motorsDisabled}
              inplace
            />
            <MotorInput
              save={this.props.save}
              value={this.props.motors.sample_horizontal.value}
              saveStep={this.props.saveStep}
              step={this.props.motors.sample_horizontal.step}
              motorName={this.props.motors.sample_horizontal.attribute}
              label={this.props.motors.sample_horizontal.label}
              suffix={this.props.motors.sample_horizontal.suffix}
              decimalPoints={this.props.motors.sample_horizontal.precision}
              state={this.props.motors.sample_horizontal.state}
              stop={this.props.stop}
              disabled={this.props.motorsDisabled}
              inplace
            />
          </div>
        </Popover>);
  }

  render() {
    const {
      sample_verticalStep,
      sample_horizontalStep
    } = this.props.steps;

    return (
      <div className="arrow-control">
        <p className="motor-name">Sample alignment:</p>
        <div style={{ marginBottom: '1em' }}></div>
        <Button
          size="sm"
          variant="outline-dark"
          onClick={() => this.stepChange('sample_vertical', sample_verticalStep, 1)}
          disabled={this.props.motors.sample_vertical.state !== MOTOR_STATE.READY ||
          this.props.motorsDisabled}
          className="arrow arrow-up"
        >
          <i className="fas fa-angle-up" />
        </Button>
        <Button
          size="sm"
          variant="outline-dark"
          className="arrow arrow-left"
          disabled={this.props.motors.sample_horizontal.state !== MOTOR_STATE.READY ||
           this.props.motorsDisabled}
          onClick={() => this.stepChange('sample_horizontal', sample_horizontalStep, -1)}
        >
          <i className="fas fa-angle-left" />
        </Button>
        <OverlayTrigger trigger="click" rootClose placement="right"
          overlay={this.renderMotorSettings()}
        >
          <Button
            size="sm"
            variant="outline-dark"
            className="arrow arrow-settings"
          >
            <i className="fas fa-cog" />
          </Button>
        </OverlayTrigger>
        <Button
          size="sm"
          variant="outline-dark"
          className="arrow arrow-right"
          disabled={this.props.motors.sample_horizontal.state !== MOTOR_STATE.READY ||
           this.props.motorsDisabled}
          onClick={() => this.stepChange('sample_horizontal', sample_horizontalStep, 1)}
        >
          <i className="fas fa-angle-right" />
        </Button>
        <Button
          size="sm"
          variant="outline-dark"
          className="arrow arrow-down"
          disabled={this.props.motors.sample_vertical.state !== MOTOR_STATE.READY ||
          this.props.motorsDisabled}
          onClick={() => this.stepChange('sample_vertical', sample_verticalStep, -1)}
        >
          <i className="fas fa-angle-down" />
        </Button>
      </div>
    );
  }
}
