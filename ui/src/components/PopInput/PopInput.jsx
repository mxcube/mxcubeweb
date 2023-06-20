import React from 'react';

import { OverlayTrigger, Popover } from 'react-bootstrap';
import { STATE } from '../../actions/beamline';

import DefaultInput from './DefaultInput';
import './style.css';
import '../input.css';

/**
 * A simple "Popover Input" input control, the value is displayed as text and
 * the associated input is displayed in an overlay when the text is clicked.
 *
 * Valid react properties are:
 *
 *   dataType:   The data type of the value (the input will addapt
 *               accordingly)
 *   inputSize:  Input field size, with any html unit; px, em, rem ...
 *   pkey:       Key used when retreiving or sending data to server
 *   name:       Name displayed in label
 *   suffix:     Suffix to display after value
 *   data:       Object containing value, the current state of the value and
 *               a message describing the state. The object have the following
 *               format:
 *
 *                    data: {value: <value>, state: <state>, msg: <msg>}
 *
 *   title:      Title displayed at the top of popover
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
    if (this.props.data.state === 'IMMEDIATE') {
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
    return this.props.data.state === STATE.BUSY;
  }

  isIdle() {
    return this.props.data.state === STATE.IDLE;
  }

  isAborted() {
    return this.props.data.state === STATE.ABORT;
  }

  render() {
    const title = this.props.title || this.props.name;

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
            <DefaultInput
              precision={this.props.precision}
              step={this.props.data.step}
              dataType={this.props.dataType}
              inputSize={this.props.inputSize}
              inplace={this.props.inplace}
              value={this.props.data.value}
              busy={this.isBusy()}
              onSubmit={this.save}
              onCancel={this.cancel}
            />
          }
        </div>
        <div>{this.props.data.msg}</div>
      </div>
    );

    let value = this.props.data.value
      ? Number.parseFloat(this.props.data.value)
      : '-';

    if (value !== '-' && this.props.precision) {
      value = value.toFixed(Number.parseInt(this.props.precision, 10));
    }

    return (
      <div
        style={this.props.style}
        className={`${this.props.className} popinput-input-container`}
      >
        {this.props.name && (
          <span className={`popinput-input-label ${this.props.ref}`}>
            {this.props.name} :
          </span>
        )}
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
                <Popover id={title} title={title} style={{ padding: '0.5em' }}>
                  {popoverContent}
                </Popover>
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
  dataType: 'number',
  inputSize: '5',
  precision: 1,
  step: 0.1,
  suffix: '',
  value: 0,
  style: {},
  placement: 'right',
  pkey: undefined,
  onSave: undefined,
  onCancel: undefined,
  data: { value: 0, state: 'ABORTED', msg: '', step: 0.1 },
};
