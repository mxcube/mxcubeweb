import React from 'react';
import '../MotorInput/motor.css';
import '../input.css';
import cx from 'classnames';

export default class PhaseInput extends React.Component {
  constructor(props) {
    super(props);
    this.sendPhase = this.sendPhase.bind(this);
  }

  sendPhase(event) {
    if (event.target.value !== 'Unknown') {
      this.props.sendPhase(event.target.value);
    }
  }

  render() {
    const inputCSS = cx('form-control input-sm', {
      'input-bg-moving': (this.props.state !== 'READY'),
      'input-bg-ready': (this.props.state === 'READY'),
    });

    return (
      <div className="motor-input-container">
        <select
          className={inputCSS}
          onChange={this.sendPhase}
          value={this.props.phase}
        >
          {this.props.phaseList.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
}
