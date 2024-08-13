import React from 'react';
import { Form } from 'react-bootstrap';
import '../MotorInput/motor.css';
import '../input.css';
import cx from 'classnames';

export default class PhaseInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    if (event.target.value !== 'Unknown') {
      this.props.changePhase(event.target.value);
    }
  }

  render() {
    const inputCSS = cx('form-control input-sm', {
      'input-bg-moving': this.props.state !== 'READY',
      'input-bg-ready': this.props.state === 'READY',
    });

    return (
      <div className="motor-input-container">
        <Form.Select
          className={inputCSS}
          style={{ float: 'none' }}
          value={this.props.phase}
          onChange={this.handleChange}
        >
          {this.props.phaseList.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Form.Select>
      </div>
    );
  }
}
