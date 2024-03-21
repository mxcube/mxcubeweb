import React from 'react';
import { Form } from 'react-bootstrap';
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

import '../MotorInput/motor.css';
import '../input.css';
import './SampleView.css';
import cx from 'classnames';

export default class BeamDefinerInput extends React.Component {
  constructor(props) {
    super(props);
    this.changeBeamDefiner = this.changeBeamDefiner.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  changeBeamDefiner(event) {
    this.props.changeBeamDefiner(event.target.value);
  }

  handleChange(event) {
    this.props.changeAperture(event);
  }

  itemColor(status) {
    let col;
    if (status === 'disable') {
      col = 'red';
    } else if (status === 'warning') {
      col = '#fc9003'; // darker orange
    } else {
      col = 'black';
    }
    return col;
  }

  render() {
    const apertureListStatus = this.props.customStyling;

    let optionList = [];
    const stateClass = 'input-bg-ready';
    const inputCSS = cx(`form-control input-sm ${stateClass}`);

    // The folling logic handles custom styling if supplied by the hwobj
    if (apertureListStatus !== null) {
      const currentApertureListStatus =
        apertureListStatus[this.props.currentDefiner];

      if (currentApertureListStatus !== undefined) {
        const ks = Object.keys(currentApertureListStatus);

        optionList = ks.map((size, index) => ({
          label: size === '5' || size === '10' ? `${size} (only mesh)` : size,
          value: size,
          fontColor: this.itemColor(currentApertureListStatus[ks[index]]),
          id: index,
          isDisabled: currentApertureListStatus[ks[index]] === 'disable',
          isWarning: currentApertureListStatus[ks[index]] === 'warning',
        }));
      }
    } else {
      optionList = this.props.apertureList.map((ap) => ({
        label: ap,
        value: ap.toString(),
        fontColor: 'black',
      }));
    }
    const currentOption = optionList.find(
      (item) => item.value === this.props.aperture.toString(),
    );

    return (
      <div>
        <p className="motor-name">Beam Definer:</p>
        <Dropdown
          className="w-100"
          as={ButtonGroup}
          size="sm"
          style={{ float: 'none' }}
        >
          <Dropdown.Toggle
            className="input-bg-ready dropdown-toggle-beamdefiner"
            style={{
              color: currentOption.fontColor,
              width: '100%',
              textAlign: 'left',
            }}
          >
            {currentOption.label}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {optionList.map((option) => (
              <Dropdown.Item
                key={option}
                value={option.label}
                className="float-left"
                disabled={option.isDisabled}
                style={{ color: option.fontColor }}
                onClick={() => this.handleChange(option.value)}
              >
                {option.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
        <Form.Select
          className={inputCSS}
          value={this.props.currentDefiner}
          onChange={(event) => this.changeBeamDefiner(event)}
        >
          {this.props.beamDefinerInputList.map((option, index) => (
            <option
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              value={option}
              disabled={option === 'UNKNOWN'}
            >
              {option}
            </option>
          ))}
        </Form.Select>
      </div>
    );
  }
}
