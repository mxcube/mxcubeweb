/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { HW_STATE } from '../../constants';
import styles from './MotorInput.module.css';
import './motor.css';

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
      this.props.state === HW_STATE.READY
    ) {
      this.setState({ edited: false });
      this.props.save(e.target.name, e.target.valueAsNumber);
      this.motorValue.value = this.props.value.toFixed(
        this.props.decimalPoints,
      );
    } else if (this.props.state === HW_STATE.BUSY) {
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

    return (
      <div className="motor-input-container">
        <p className="motor-name">{this.props.label}</p>
        <form className={styles.form} onSubmit={this.handleKey} noValidate>
          <div
            className="rw-widget rw-numberpicker rw-widget-no-right-border"
            style={{ width: '90px', display: 'inline-block' }}
          >
            <span className="rw-select">
              <button
                type="button"
                className="rw-btn"
                disabled={
                  this.props.state !== HW_STATE.READY || this.props.disabled
                }
                onClick={this.stepIncrement}
              >
                <i aria-hidden="true" className="rw-i fas fa-caret-up" />
              </button>
              <button
                type="button"
                className="rw-btn"
                disabled={
                  this.props.state !== HW_STATE.READY || this.props.disabled
                }
                onClick={this.stepDecrement}
              >
                <i aria-hidden="true" className="rw-i fas fa-caret-down" />
              </button>
            </span>
            <Form.Control
              ref={(ref) => {
                this.motorValue = ref;
              }}
              className={`${styles.valueInput} rw-input`}
              onKeyUp={this.handleKey}
              type="number"
              step={step}
              defaultValue={valueCropped}
              name={motorName}
              disabled={
                this.props.state !== HW_STATE.READY || this.props.disabled
              }
              data-dirty={this.state.edited || undefined}
              data-busy={this.props.state === HW_STATE.BUSY || undefined}
              data-warning={this.props.state === HW_STATE.WARNING || undefined}
              data-fault={
                this.props.state === HW_STATE.UNKNOWN ||
                this.props.state === HW_STATE.FAULT ||
                this.props.state === HW_STATE.OFF ||
                undefined
              }
            />
          </div>
          {this.props.saveStep &&
            (this.props.state === HW_STATE.READY ? (
              <>
                <input
                  className={styles.stepInput}
                  type="number"
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
