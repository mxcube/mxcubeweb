import React from 'react';

import { OverlayTrigger, Popover } from 'react-bootstrap';
import { STATE } from '../../actions/beamline';

import NumericInput from './NumericInput';
import './style.css';
import '../input.css';

/**
 * Popover numeric input control. The value is displayed as text and
 * the associated input is displayed in an overlay when the text is clicked.
 *
 * Valid react properties are:
 *
 *   inputSize:  Input field size, with any html unit; px, em, rem ...
 *   pkey:       Key used when retreiving or sending data to server
 *   value:      Value of the input
 *   state:      State of the input ()
 *   msg:        Message describing the state
 *   step        Step of numeric input
 *   precision   Precision of value
 *   suffix:     Suffix to display after value
 *   inputSize   Size of input
 *   placement:  Placement of Popover (left, right, bottom, top)
 *   onSave:     Callback called when user hits save button
 *   onCancel:   Callback called when user hits cancel button
 *
 * @class
 *
 */
export default class PopInput extends React.Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.hideOverlay = this.hideOverlay.bind(this);
  }

  hideOverlay() {
    document.body.click();
  }

  save(value) {
    if (this.props.onSave !== undefined) {
      // Only update if value actually changed
      this.props.onSave(this.props.pkey, value);
    }
    if (!this.props.inplace && this.props.immediate) {
      this.hideOverlay();
    }
  }

  cancel() {
    if (!this.isBusy()) {
      this.hideOverlay();
      return;
    }

    if (this.props.onCancel !== undefined) {
      this.props.onCancel(this.props.pkey);
    }
  }

  isBusy() {
    return this.props.state === STATE.BUSY;
  }

  isIdle() {
    return this.props.state === STATE.IDLE;
  }

  isAborted() {
    return this.props.state === STATE.ABORT;
  }

  render() {
    let stateClass = '';
    if (this.isBusy()) {
      stateClass = 'input-bg-moving';
    } else if (this.isAborted()) {
      stateClass = 'input-bg-fault';
    }

    const popoverContent = (
      <div className="d-flex">
        <div className="popinput-form-container">
          {
            <NumericInput
              precision={this.props.precision}
              step={this.props.step}
              inputSize={this.props.inputSize}
              inplace={this.props.inplace}
              value={this.props.value}
              busy={this.isBusy()}
              onSubmit={this.save}
              onCancel={this.cancel}
            />
          }
        </div>
        {this.props.msg && <div>{this.props.msg}</div>}
      </div>
    );

    let value = this.props.value ? Number.parseFloat(this.props.value) : '-';

    if (value !== '-' && this.props.precision) {
      value = value.toFixed(Number.parseInt(this.props.precision, 10));
    }

    return (
      <div
        style={this.props.style}
        className={`${this.props.className} popinput-input-container`}
      >
        <span className={`popinput-input-value ${this.props.pkey}`}>
          {this.props.inplace ? (
            <>{popoverContent}</>
          ) : (
            <OverlayTrigger
              id="popOverlayRef"
              trigger="click"
              rootClose
              placement={this.props.placement}
              overlay={
                <Popover style={{ padding: '0.5em' }}>{popoverContent}</Popover>
              }
            >
              <a
                ref={(ref) => (this.valueLabel = ref)}
                key="valueLabel"
                className={`popinput-input-link editable-click ${stateClass}`}
              >
                {value} {this.props.suffix}
              </a>
            </OverlayTrigger>
          )}
        </span>
      </div>
    );
  }
}

PopInput.defaultProps = {
  className: '',
  style: undefined,
  pkey: undefined,
  value: 0,
  state: STATE.IDLE,
  msg: undefined,
  step: 0.1,
  precision: 1,
  suffix: '',
  inputSize: '5',
  placement: 'right',
  immediate: false,
  onSave: undefined,
  onCancel: undefined,
};
