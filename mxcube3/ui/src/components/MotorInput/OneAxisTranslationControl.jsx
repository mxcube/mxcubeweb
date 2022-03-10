import React from 'react';
import cx from 'classnames';
import { Button, Popover } from 'react-bootstrap';
import { MOTOR_STATE } from '../../constants';
import MotorInput from './MotorInput';
import './motor.css';

export default class OneAxisTranslationControl extends React.Component {

  constructor(props) {
    super(props);
    this.state = { edited: false };
    this.handleKey = this.handleKey.bind(this);
    this.stepChange = this.stepChange.bind(this);
  }

  /* eslint-enable react/no-set-state */
  componentWillReceiveProps(nextProps) {
    if(nextProps.value) {
      if (nextProps.value !== this.props.value) {
        this.motorValue.value = nextProps.value.toFixed(this.props.decimalPoints);
        this.motorValue.defaultValue = nextProps.value.toFixed(this.props.decimalPoints);
        this.setState({ edited: false });
      }
    }
  }

  handleKey(e) {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ edited: true });
    if (this.props.value) {
      if ([13, 38, 40].includes(e.keyCode) && this.props.state === MOTOR_STATE.READY) {
        this.setState({ edited: false });
        this.props.save(e.target.name, e.target.valueAsNumber);
        this.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
      } else if (this.props.state === MOTOR_STATE.BUSY || this.props.state === MOTOR_STATE.MOVING) {
        this.setState({ edited: false });
        this.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
      }
    }
  }
  /* eslint-enable react/no-set-state */

  stepChange(name, step, operator) {
    const value = this.props.value;
    const newValue = value + step * operator;
    this.props.save(name, newValue);
  }

  renderMotorSettings() {
    return (
      <Popover title={(<b>Sample alignment motors</b>)}>
        <div>
          <MotorInput
            save={this.props.save}
            value={this.props.motors.sample_vertical.position}
            saveStep={this.props.saveStep}
            step={this.props.steps.sample_verticalStep}
            motorName="sample_vertical"
            label="Vertical"
            suffix="mm"
            decimalPoints="3"
            state={this.props.motors.sample_vertical.state}
            stop={this.props.stop}
            disabled={this.props.motorsDisabled}
            inplace
          />
          <MotorInput
            save={this.props.save}
            value={this.props.motors.sample_horizontal.position}
            saveStep={this.props.saveStep}
            step={this.props.steps.sample_horizontalStep}
            motorName="sample_horizontal"
            label="Horizontal"
            suffix="mm"
            decimalPoints="3"
            state={this.props.motors.sample_horizontal.state}
            stop={this.props.stop}
            disabled={this.props.motorsDisabled}
            inplace
          />
        </div>
      </Popover>);
  }

  render() {
    const { value, motorName, step, decimalPoints } = this.props;
    const valueCropped = value ? value.toFixed(decimalPoints) : '';

    const inputCSS = cx('form-control rw-input', {
      'input-bg-edited': this.state.edited,
      'input-bg-moving': this.props.state === MOTOR_STATE.BUSY ||
                         this.props.state === MOTOR_STATE.MOVING,
      'input-bg-ready': this.props.state === MOTOR_STATE.READY,
      'input-bg-fault': this.props.state === MOTOR_STATE.FAULT ||
                        this.props.state === MOTOR_STATE.OFF ||
                        this.props.state === MOTOR_STATE.ALARM ||
                        this.props.state === MOTOR_STATE.OFFLINE ||
                        this.props.state === MOTOR_STATE.INVALID,
      'input-bg-onlimit': this.props.state === MOTOR_STATE.LOWLIMIT ||
        this.props.state === MOTOR_STATE.HIGHLIMIT
    });

    return (
      <div className="arrow-control">
        <Button
          style={{ marginRight: '2px' }}
          className="arrow-small arrow-left"
          disabled={this.props.state !== MOTOR_STATE.READY || this.props.disabled}
          onClick={() => this.stepChange(motorName, 10 * step, -1)}
        >
          <i className="fas fa-angle-double-left" />
        </Button>
        <Button
          className="arrow-small arrow-left"
          disabled={this.props.state !== MOTOR_STATE.READY || this.props.disabled}
          onClick={() => this.stepChange(motorName, step, -1)}
        >
          <i className="fas fa-angle-left" />
        </Button>
        <input
          style={{ width: `${parseFloat(decimalPoints) + 2}em`,
            height: '2.1em',
            display: 'inline-block',
            marginLeft: '5px',
            marginRight: '5px'
          }}
          ref={(ref) => { this.motorValue = ref; }}
          className={inputCSS}
          onKeyUp={this.handleKey}
          type="number"
          max={this.props.max}
          min={this.props.min}
          step={step}
          defaultValue={valueCropped}
          name={motorName}
          disabled={this.props.state !== MOTOR_STATE.READY || this.props.disabled}
        />
        <Button
          className="arrow-small arrow-right"
          disabled={this.props.state !== MOTOR_STATE.READY || this.props.disabled}
          onClick={() => this.stepChange(motorName, step, 1)}
        >
          <i className="fas fa-angle-right" />
        </Button>
        <Button
          style={{ marginLeft: '2px' }}
          className="arrow-small arrow-right"
          disabled={this.props.state !== MOTOR_STATE.READY || this.props.disabled}
          onClick={() => this.stepChange(motorName, 10 * step, 1)}
        >
          <i className="fas fa-angle-double-right" />
        </Button>
      </div>
    );
  }
}
