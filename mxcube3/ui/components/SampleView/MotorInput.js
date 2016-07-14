import React from 'react';
import cx from 'classnames';
import { Button } from 'react-bootstrap';
import PopInput from '../PopInput/PopInput';
import './motor.css';

export default class MotorInput extends React.Component {

  constructor(props) {
    super(props);
    this.handleKey = this.handleKey.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.stopMotor = this.stopMotor.bind(this, props.motorName);
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
    } else if (this.props.state === 4) {
      this.refs.motorValue.value = this.props.value.toFixed(this.props.decimalPoints);
    }
  }

  handleClick(e) {
    const { value, decimalPoints, state } = this.props;
    if (e.target.value !== value.toFixed(decimalPoints) && state === 2) {
      this.props.save(e.target.name, e.target.valueAsNumber);
    } else if (state === 4) {
      this.refs.motorValue.value = value.toFixed(decimalPoints);
    }
  }

  stopMotor(name) {
    this.props.stop(name);
  }

  render() {
    const { value, motorName, step, suffix, decimalPoints } = this.props;
    const valueCropped = value.toFixed(decimalPoints);
    let inputCSS = cx('form-control input-sm', {
      'input-bg-moving': this.props.state === 4 || this.props.state === 3,
      'input-bg-ready': this.props.state === 2,
      'input-bg-fault': this.props.state <= 1,
      'input-bg-onlimit': this.props.state === 5
    });

    let data = { state: 'IMMEDIATE', value: step };

    return (
          <form className="inline form-inline form-group" onSubmit={this.handleKey} noValidate>
              <input
                ref="motorValue"
                className={inputCSS}
                onKeyUp={this.handleKey}
                onClick={this.handleClick}
                type="number"
                step={step}
                defaultValue={valueCropped}
                name={motorName}
                disabled={this.props.state === 4 || this.props.state === 3 || this.props.state <= 1}
              />
              {this.props.saveStep ?
                <span>
                  <Button
                    className="btn-sm motor-abort"
                    bsStyle="default"
                    disabled={this.props.state !== 4}
                    onClick={this.stopMotor}
                  >
                    <i className="glyphicon glyphicon-remove" />
                  </Button>
                  <PopInput
                    className="step-size"
                    ref={motorName} name="Step size" pkey={`${motorName.toLowerCase()}Step`}
                    data={data} onSave={this.props.saveStep} suffix={suffix}
                  />
                </span>
                : null
              }

          </form>
      );
  }
}
