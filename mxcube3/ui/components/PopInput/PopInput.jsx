import React from 'react';

import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { STATE } from '../../actions/beamline_atypes';


import DefaultInput from './DefaultInput';
import DefaultBusy from './DefaultBusy';
import './style.css';


/**
 * A simple "Popover Input" input conrol, the value is displayed as text and
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
    this.submit = this.submit.bind(this);
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.data.state !== this.props.data.state) {
      if (this.isIdle()) {
        this.handleIdle(nextProps.data);
      } else if (this.isAborted()) {
        this.handleError(nextProps.data);
      } else {
        this.handleError(nextProps.data);
      }
    }
  }


  shouldComponentUpdate(nextProps) {
    return nextProps.data !== this.props.data;
  }


  getChild(key) {
    let children = this.props.children;
    let child;

    // We need to create a real array here since react is so kind to give us
    // undefined if there is no children and an object if there is only one.
    if (this.props.children === undefined) {
      children = [];
    } else if (!Array.isArray(this.props.children)) {
      children = [this.props.children];
    }

    for (const c in children) {
      if (children[c].key === key) {
        child = children[c];
      }
    }

    return child;
  }


  setValue(value) {
    if (this.props.onSave !== undefined) {
      // Only update if value actually changed
      this.props.onSave(this.props.pkey, value);
    }
    if (this.props.data.state === 'IMMEDIATE') {
      this.refs.overlay.hide();
    }
  }


  handleIdle(data) {
    // No message to display to user, hide overlay
    if (data.msg === '') {
      this.refs.overlay.hide();
    }
  }


  handleError(data) {
    // No message to display to user, hide overlay
    if (data.msg === '') {
      this.refs.overlay.hide();
    }
  }


  save() {
    this.setValue(this.refs.input.getValue());
  }


  cancel() {
    if (this.props.onCancel !== undefined) {
      this.props.onCancel(this.props.pkey);
    }

    if (!this.isBusy()) {
      this.refs.overlay.hide();
    }
  }


  submit(event) {
    event.preventDefault();
    this.save();
  }


  inputComponent() {
    const props = { value: this.props.data.value,
                    ref: 'input',
                    onSubmit: this.submit,
                    onCancel: this.cancel,
                    onSave: this.save };

    let input = (<DefaultInput dataType={this.props.dataType} inputSize={this.props.inputSize} />);

    input = this.getChild('input') || input;
    input = React.cloneElement(input, props);

    return input;
  }


  busyComponent() {
    const props = { onCancel: this.cancel };
    let input = (<DefaultBusy />);

    input = this.getChild('busy') || input;
    input = React.cloneElement(input, props);

    return input;
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
    const linkClass = 'editable-click';
    const busyVisibility = this.isBusy() ? '' : 'hidden';
    const inputVisibility = !this.isBusy() ? '' : 'hidden';
    const title = (this.props.title === '') ? this.props.name : this.props.title;

    let stateClass = '';

    if (this.isBusy()) {
      stateClass = 'value-label-enter-loading';
    } else if (this.isAborted()) {
      stateClass = 'value-label-enter-error';
    }

    const popover = (
      <Popover id={title} title={title}>
        <div className={`${inputVisibility} popinput-form-container`}>
          {this.inputComponent()}
        </div>
        <div ref="statusMessage" className={inputVisibility} >{this.props.data.msg}</div>
        <div ref="loadingDiv" className={`${busyVisibility} popinput-input-loading`} >
          {this.busyComponent()}
        </div>
      </Popover>);

    return (
      <div className={`${this.props.className} popinput-input-container`}>
        <span className={`popinput-input-label ${this.props.ref}`}>
          {this.props.name}:
        </span>
        <span className={`popinput-input-value ${this.props.pkey}`}>
          <OverlayTrigger ref="overlay" trigger="click" rootClose placement={this.props.placement}
            overlay={popover}
          >
            <a ref="valueLabel" key="valueLabel" className={`${linkClass} ${stateClass}`}>
              {this.props.data.value} {this.props.suffix}
            </a>
          </OverlayTrigger>
        </span>
      </div>
    );
  }
}


PopInput.defaultProps = {
  className: '',
  dataType: 'number',
  inputSize: '100px',
  name: '',
  title: '',
  suffix: '',
  value: 0,
  placement: 'right',
  pkey: undefined,
  onSave: undefined,
  onCancel: undefined,
  data: { value: 0, state: 'ABORTED', msg: '' }
};
