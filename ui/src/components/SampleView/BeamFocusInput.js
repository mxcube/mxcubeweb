import React from 'react';
import '../MotorInput/motor.css';
import '../input.css';
import cx from 'classnames';
import Select from 'react-select';

export default class BeamFocusInput extends React.Component {
  constructor(props) {
    super(props);
    this.changeBeamFocus = this.changeBeamFocus.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  changeBeamFocus(event) {
    this.props.changeBeamFocus(event.target.value);
  }

  handleChange(event) {
    this.props.changeAperture(event.target.value);
  }

  itemColor(status) {
    let col;
    if (status === 'disable') {
      col = 'red';
    } else if (status === 'warning') {
      col = 'orange';
    } else {
      col = 'black';
    }
    return col;
  }

  render() {
    console.log('REDNER FOXUS', this.props);
    let selectedBeamFocus = 'undefined';
    const apertureListStatus = {
      undefined: {
        100: 'default',
        50: 'normal',
        20: 'normal',
        10: 'normal',
        5: 'normal',
      },
      '100x100': {
        100: 'default',
        50: 'normal',
        20: 'normal',
        10: 'warning',
        5: 'warning',
      },
      '50x50': {
        100: 'disable',
        50: 'default',
        20: 'normal',
        10: 'warning',
        5: 'warning',
      },
      '20x5': {
        100: 'disable',
        50: 'disable',
        20: 'normal',
        10: 'default',
        5: 'normal',
      },
    };
    // STATES: (NOTINITIALIZED, UNUSABLE, READY, MOVESTARTED, MOVING, ONLIMIT) = (0,1,2,3,4,5)
    const stateMot01 = this.props.beamFocus.mot01.state;
    const stateMot02 = this.props.beamFocus.mot02.state;
    let stateClass = '';

    if (stateMot01 && stateMot02) {
      selectedBeamFocus = `${stateMot01 * 1000}x${stateMot02 * 1000}`;
    }
    const currentApertureListStatus = apertureListStatus[selectedBeamFocus];
    let color = '#9BCE7B';
    if (currentApertureListStatus !== undefined) {
      const status = currentApertureListStatus[this.props.aperture];
      if (status === 'warning') {
        color = '#ffc107';
      }
    }

    let optionList = [];

    if (currentApertureListStatus !== undefined) {
      const ks = Object.keys(currentApertureListStatus);

      optionList = ks.map((size, index) => ({
        label: (size === '5') | (size === '10') ? `${size} (only mesh)` : size,
        value: size,
        fontColor: this.itemColor(currentApertureListStatus[ks[index]]),
        id: index,
        isDisabled: currentApertureListStatus[ks[index]] === 'disable',
        isWarning: currentApertureListStatus[ks[index]] === 'warning',
      }));
    } else {
      optionList = [{ label: 'na', value: 'na', fontColor: 'black' }];
    }

    const colourStyles = {
      control: (styles) => ({
        ...styles,
        backgroundColor: color,
        fontSize: '12px',
        marginBottom: '1em',
        minHeight: '30px',
        height: '30px',
        paddingLeft: '4px',
      }),
      indicatorSeparator: () => ({}),
      dropdownIndicator: (styles) => ({
        ...styles,
        color: 'black',
        fontSize: '12px',
        fontWight: 'normal',
        padding: '0',
        width: '15px',
        '&:hover': {
          color: 'black',
        },
      }),
      option: (styles, { data, isDisabled }) => ({
        ...styles,
        color: data.fontColor,
        cursor: isDisabled ? 'not-allowed' : 'default',
        fontSize: '12px',
      }),
    };

    if (
      (stateMot01 !== 2 && stateMot01 !== 4) ||
      (stateMot02 !== 2 && stateMot02 !== 4)
    ) {
      stateClass = 'input-bg-fault';
    } else {
      stateClass =
        stateMot01 === 4 || stateMot02 === 4
          ? 'input-bg-moving'
          : 'input-bg-ready';
    }

    const inputCSS = cx(`form-control input-sm ${stateClass}`);
    let curBeamFocus = '';
    const _v1 = this.props.beamFocus.mot01.value;
    const _v2 = this.props.beamFocus.mot02.value;

    if (_v1 && _v2) {
      curBeamFocus = `${_v1 * 1000}x${_v2 * 1000}`;
    }
    return (
      <div className="motor-input-container">
        <p className="motor-name">Beam Focus:</p>
        <Select
          value={{
            label: this.props.aperture.toString(),
            value: this.props.aperture,
          }}
          label="Beam Size"
          options={optionList}
          styles={colourStyles}
          onChange={this.changeAperture}
        />
        <select
          className={inputCSS}
          value={curBeamFocus}
          onChange={(event) => this.changeBeamFocus(event)}
        >
          {this.props.beamFocusInputList.map((option, index) => (
            <option
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              value={option}
              disabled={option === 'Undefined'}
            >
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
}
