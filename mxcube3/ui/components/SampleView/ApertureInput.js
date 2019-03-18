import React from 'react';
import '../MotorInput/motor.css';
import '../input.css';
import cx from 'classnames';

export default class ApertureInput extends React.Component {
  constructor(props) {
    super(props);
    this.sendAperture = this.sendAperture.bind(this);
  }

  sendAperture(event) {
    this.props.sendAperture(event.target.value);
  }

  render() {
    const inputCSS = cx('form-control input-sm', {
      'input-bg-moving': this.props.aperture === 'Unknown',
      'input-bg-ready': this.props.aperture !== 'Unknown'
    });

    return (
      <div className="motor-input-container">
        <select
          className={inputCSS}
          onChange={this.sendAperture}
          value={this.props.aperture}
        >
          {this.props.apertureList.map(option => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
}
