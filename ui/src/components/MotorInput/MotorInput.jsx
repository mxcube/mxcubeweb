/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-handler-names */
import React from 'react';
import cx from 'classnames';
import { Button } from 'react-bootstrap';
import { MOTOR_STATE } from '../../constants';
import styles from './MotorInput.module.css';
import './motor.css';
import '../input.css';

// eslint-disable-next-line react/no-unsafe
export default class MotorInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = { edited: false };

    this.handleKey = this.handleKey.bind(this);
    this.stopMotor = this.stopMotor.bind(this, props.motorName);
    this.stepIncrement = this.stepChange.bind(this, props.motorName, 1);
    this.stepDecrement = this.stepChange.bind(this, props.motorName, -1);
  }

  /* eslint-enable react/no-set-state */
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.motorValue.value = nextProps.value.toFixed(this.props.decimalPoints);
      this.motorValue.defaultValue = nextProps.value.toFixed(
        this.props.decimalPoints,
      );
      this.setState({ edited: false });
    }
  }

  handleKey(e) {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ edited: true });

    if (
      [13, 38, 40].includes(e.keyCode) &&
      this.props.state === MOTOR_STATE.READY
    ) {
      this.setState({ edited: false });
      this.props.save(e.target.name, e.target.valueAsNumber);
      this.motorValue.value = this.props.value.toFixed(
        this.props.decimalPoints,
      );
    } else if (
      this.props.state === MOTOR_STATE.BUSY ||
      this.props.state === MOTOR_STATE.MOVING
    ) {
      this.setState({ edited: false });
      this.motorValue.value = this.props.value.toFixed(
        this.props.decimalPoints,
      );
    }
  }
  /* eslint-enable react/no-set-state */

  stepChange(name, operator) {
    const { value, step } = this.props;
    const newValue = value + step * operator;

    this.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
    this.motorValue.defaultValue = newValue;
    this.props.save(name, newValue);
  }

  stopMotor(name) {
    this.props.stop(name);
  }

  render() {
    const { value, motorName, step, suffix, decimalPoints } = this.props;
    const valueCropped = value.toFixed(decimalPoints);
    const inputCSS = cx('form-control rw-input', {
      'input-bg-edited': this.state.edited,
      'input-bg-moving':
        this.props.state === MOTOR_STATE.BUSY ||
        this.props.state === MOTOR_STATE.MOVING,
      'input-bg-ready': this.props.state === MOTOR_STATE.READY,
      'input-bg-fault':
        this.props.state === MOTOR_STATE.FAULT ||
        this.props.state === MOTOR_STATE.OFF ||
        this.props.state === MOTOR_STATE.ALARM ||
        this.props.state === MOTOR_STATE.OFFLINE ||
        this.props.state === MOTOR_STATE.UNKNOWN ||
        this.props.state === MOTOR_STATE.INVALID,
      'input-bg-onlimit':
        this.props.state === MOTOR_STATE.LOWLIMIT ||
        this.props.state === MOTOR_STATE.HIGHLIMIT,
    });

    return (
      <div className="motor-input-container">
        <p className="motor-name">{this.props.label}</p>
        <form className="d-flex" onSubmit={this.handleKey} noValidate>
          <div
            className="rw-widget rw-numberpicker rw-widget-no-right-border"
            style={{ width: '90px', display: 'inline-block' }}
          >
            <span className="rw-select">
              <button
                type="button"
                className="rw-btn"
                disabled={
                  this.props.state !== MOTOR_STATE.READY || this.props.disabled
                }
                onClick={this.stepIncrement}
              >
                <i aria-hidden="true" className="rw-i fas fa-caret-up" />
              </button>
              <button
                type="button"
                className="rw-btn"
                disabled={
                  this.props.state !== MOTOR_STATE.READY || this.props.disabled
                }
                onClick={this.stepDecrement}
              >
                <i aria-hidden="true" className="rw-i fas fa-caret-down" />
              </button>
            </span>
            <input
              ref={(ref) => {
                this.motorValue = ref;
              }}
              className={inputCSS}
              onKeyUp={this.handleKey}
              type="number"
              step={step}
              defaultValue={valueCropped}
              name={motorName}
              disabled={
                this.props.state !== MOTOR_STATE.READY || this.props.disabled
              }
            />
          </div>
          {this.props.saveStep &&
            (this.props.state === MOTOR_STATE.READY ? (
              <>
                <input
                  className={styles.stepInput}
                  type="number"
                  size={3}
                  defaultValue={step}
                  disabled={this.props.disabled}
                  onChange={(evt) =>
                    this.props.saveStep(
                      motorName.toLowerCase(),
                      Number(evt.target.value),
                    )
                  }
                />
                <span className={styles.unit}>{suffix}</span>
              </>
            ) : (
              <Button
                className="btn-xs motor-abort rw-widget-no-left-border"
                variant="danger"
                onClick={this.stopMotor}
              >
                <i className="fas fa-times" />
              </Button>
            ))}
        </form>
      </div>
    );
  }
}
