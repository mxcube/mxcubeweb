import React from 'react';
import { Form } from 'react-bootstrap';
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

import '../MotorInput/motor.css';
import '../input.css';
import './SampleView.css';
import cx from 'classnames';

const ITEM_COLOR = {
  disable: 'red',
  warning: '#fc9003',
};

function BeamDefinerInput(props) {
  const changeBeamDefiner = (event) => {
    props.changeBeamDefiner(event.target.value);
  };

  const handleChange = (event) => {
    props.changeAperture(event);
  };

  const apertureListStatus = props.customStyling;

  let optionList = [];
  const stateClass = 'input-bg-ready';
  const inputCSS = cx(`form-control input-sm ${stateClass}`);

  // The folling logic handles custom styling if supplied by the hwobj
  if (apertureListStatus !== null) {
    const currentApertureListStatus = apertureListStatus[props.currentDefiner];

    if (currentApertureListStatus !== undefined) {
      const ks = Object.keys(currentApertureListStatus);

      optionList = ks.map((size, index) => ({
        label: size === '5' || size === '10' ? `${size} (only mesh)` : size,
        value: size,
        fontColor: ITEM_COLOR[currentApertureListStatus[ks[index]]] || 'black',
        id: index,
        status: currentApertureListStatus[ks[index]],
        isDisabled: currentApertureListStatus[ks[index]] === 'disable',
        isWarning: currentApertureListStatus[ks[index]] === 'warning',
      }));
    }
  } else {
    optionList = props.apertureList.map((ap) => ({
      label: ap,
      value: ap.toString(),
      fontColor: 'black',
    }));
  }
  const currentOption = optionList.find(
    (item) => item.value === props.aperture.toString(),
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
              // className={styles.option}
              className="float-left"
              disabled={option.isDisabled}
              style={{ color: option.fontColor }}
              onClick={() => handleChange(option.value)}
            >
              {option.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <Form.Select
        className={inputCSS}
        value={props.currentDefiner}
        onChange={(event) => changeBeamDefiner(event)}
      >
        {props.beamDefinerInputList.map((option, index) => (
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

export default BeamDefinerInput;
