import React from 'react';
import { Form } from 'react-bootstrap';
import '../MotorInput/motor.css';
import '../input.css';
import cx from 'classnames';

export default class ApertureInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.props.changeAperture(event.target.value);
  }

  render() {
    const inputCSS = cx('form-control input-sm', {
      'input-bg-moving': this.props.aperture === 'Unknown',
      'input-bg-ready': this.props.aperture !== 'Unknown',
    });

    return (
      <div className="motor-input-container">
        <Form.Select
          className={inputCSS}
          style={{ float: 'none' }}
          value={this.props.apertureList[this.props.aperture]}
          onChange={this.handleChange}
        >
          {this.props.apertureList.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Form.Select>
      </div>
    );
  }
}
