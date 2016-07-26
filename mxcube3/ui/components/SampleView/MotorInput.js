import React from 'react';
import cx from 'classnames';
import { Button } from 'react-bootstrap';
import PopInput from '../PopInput/PopInput';
import './motor.css';

export default class MotorInput extends React.Component {

  constructor(props) {
    super(props);
    this.handleKey = this.handleKey.bind(this);
    this.stopMotor = this.stopMotor.bind(this, props.motorName);
    this.stepIncrement = this.stepChange.bind(this, props.motorName, 1);
    this.stepDecrement = this.stepChange.bind(this, props.motorName, -1);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.refs.motorValue.value = nextProps.value.toFixed(this.props.decimalPoints);
      this.refs.motorValue.defaultValue = nextProps.value.toFixed(this.props.decimalPoints);
    }
  }

  handleKey(e) {
    e.preventDefault();
    e.stopPropagation();
    if ([13, 38, 40].includes(e.keyCode) && this.props.state === 2) {
      this.props.save(e.target.name, e.target.valueAsNumber);
      this.refs.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
    } else if (this.props.state === 4) {
      this.refs.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
    }
  }

  stepChange(name, operator) {
    const { value, step } = this.props;
    const newValue = value + step * operator;

    this.refs.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
    this.refs.motorValue.defaultValue = newValue;
    this.props.save(name, newValue);
  }

  stopMotor(name) {
    this.props.stop(name);
  }

  render() {
    const { value, motorName, step, suffix, decimalPoints } = this.props;
    const valueCropped = value.toFixed(decimalPoints);
    let inputCSS = cx('form-control rw-input', {
      'input-bg-moving': this.props.state === 4 || this.props.state === 3,
      'input-bg-ready': this.props.state === 2,
      'input-bg-fault': this.props.state <= 1,
      'input-bg-onlimit': this.props.state === 5
    });

    let data = { state: 'IMMEDIATE', value: step };

    return (
          <form className="inline form-inline form-group" onSubmit={this.handleKey} noValidate>

              <div className="rw-widget rw-numberpicker">
                <span className="rw-select">
                  <button
                    type="button"
                    className="rw-btn"
                    disabled={this.props.state !== 2}
                    onClick={this.stepIncrement}
                  >
                    <i aria-hidden="true" className="rw-i rw-i-caret-up"></i>
                  </button>
                  <button
                    type="button"
                    className="rw-btn"
                    disabled={this.props.state !== 2}
                    onClick={this.stepDecrement}
                  >
                    <i aria-hidden="true" className="rw-i rw-i-caret-down"></i>
                  </button>
                </span>
                <input
                  ref="motorValue"
                  className={inputCSS}
                  onKeyUp={this.handleKey}
                  type="number"
                  step={step}
                  defaultValue={valueCropped}
                  name={motorName}
                  disabled={this.props.state !== 2}
                />
              </div>
                <span>
                {this.props.saveStep && this.props.state === 4 ?
                  <Button
                    className="btn-sm motor-abort"
                    bsStyle="danger"
                    disabled={this.props.state !== 4}
                    onClick={this.stopMotor}
                  >
                    <i className="glyphicon glyphicon-remove" />
                  </Button>
                    : null
                  }
                  {this.props.saveStep ?
                  <PopInput
                    className="step-size"
                    ref={motorName} name="Step size" pkey={`${motorName.toLowerCase()}Step`}
                    data={data} onSave={this.props.saveStep} suffix={suffix}
                  />
                  : null
                  }
                </span>

          </form>
      );
  }
}
