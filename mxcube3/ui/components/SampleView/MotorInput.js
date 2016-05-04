'use strict';
import React from 'react';

export default class MotorInput extends React.Component {

  constructor(props) {
    super(props);
    this.handleKey = this.handleKey.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleKey(e) {
    e.preventDefault();
    e.stopPropagation();
    if ([13, 38, 40].includes(e.keyCode)) {
      this.props.save(e.target.name, e.target.valueAsNumber);
    }
  }

  handleClick(e) {
    this.props.save(e.target.name, e.target.valueAsNumber);
  }

  render() {
    const { value, motorName, step, title, suffix, decimalPoints } = this.props;
    const valueCropped = value.toFixed(decimalPoints);

    return (
          <form className="inline form-inline form-group" onSubmit={this.handleKey} noValidate>
              <input className="form-control input-sm" onKeyUp={this.handleKey} onClick={this.handleClick} type="number" step={step} defaultValue={valueCropped} name={motorName} />
          </form>
      );
  }
}



