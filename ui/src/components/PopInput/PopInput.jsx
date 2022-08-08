import React from 'react';

import { OverlayTrigger, Popover } from 'react-bootstrap';
import { STATE } from '../../actions/beamline';


import DefaultInput from './DefaultInput';
import DefaultBusy from './DefaultBusy';
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
    this.submit = this.submit.bind(this);
    this.showOvelay = this.showOvelay.bind(this);
    this.state = {show: false};
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.data.state !== this.props.data.state) {
      if (this.isIdle(nextProps.data)) {
        this.handleIdle(nextProps.data);
      } else if (this.isAborted(nextProps.data)) {
        this.handleError(nextProps.data);
      } else {
        this.handleError(nextProps.data);
      }
    }
  }


  showOvelay(value) {
    this.setState({
      show: value
    });
  }



  getChild(key) {
    let {children} = this.props;
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
      this.showOvelay(false)
    }
  }


  handleIdle(data) {
    // No message to display to user, hide overlay
    if (data.msg === '') {
      this.showOvelay(false)
    }
  }


  handleError(data) {
    // No message to display to user, hide overlay
    if (data.msg === '') {
      this.showOvelay(false)
    }
  }


  save() {
    this.setValue(this.defaultInputRef.getValue());
  }


  cancel() {
    if (this.props.onCancel !== undefined && this.isBusy()) {
      this.props.onCancel(this.props.pkey);
    }

    if (!this.isBusy()) {
      this.showOvelay(false)
    }
  }

  submit(event) {
    event.preventDefault();
    this.save();
  }


  inputComponent() {
    const props = { value: this.props.data.value,
      onSubmit: this.submit,
      onCancel: this.cancel,
      onSave: this.save,
      precision: this.precision,
      step: this.props.step };

    let input = (
      <DefaultInput
        ref={(ref) => { this.defaultInputRef = ref; }}
        precision={this.props.precision}
        step={this.props.data.step}
        dataType={this.props.dataType}
        inputSize={this.props.inputSize}
        inplace={this.props.inplace}
      />);

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


  isBusy(data) {
    const state = typeof data !== 'undefined' ? data.state : this.props.data.state;
    return state === STATE.BUSY;
  }


  isIdle(data) {
    const state = typeof data !== 'undefined' ? data.state : this.props.data.state;
    return state === STATE.IDLE;
  }


  isAborted(data) {
    const state = typeof data !== 'undefined' ? data.state : this.props.data.state;
    return state === STATE.ABORT;
  }


  render() {
    const linkClass = 'editable-click';
    const busyVisibility = this.isBusy() ? '' : 'visibility-hidden';
    const inputVisibility = !this.isBusy() ? '' : 'visibility-hidden';
    const title = (this.props.title === '') ? this.props.name : this.props.title;

    let stateClass = 'value-label-enter-success';

    if (this.isBusy()) {
      stateClass = 'input-bg-moving';
    } else if (this.isAborted()) {
      stateClass = 'input-bg-fault';
    }

    const popoverContent = (
      <div className='d-flex'>
        <div className={`${inputVisibility} popinput-form-container`}>
          {this.inputComponent()}
        </div>
        <div ref="statusMessage" className={inputVisibility} >{this.props.data.msg}</div>
        <div ref="loadingDiv" className={`${busyVisibility} popinput-input-loading`} >
          {this.busyComponent()}
        </div>
      </div>);

    const popover = (
      <Popover style={{ padding: '0.5em' }} id={title} title={title}>
        { popoverContent }
      </Popover>);

    let value = this.props.data.value ? Number.parseFloat(this.props.data.value) : '-';

    if (value !== '-' && this.props.precision) {
      value = value.toFixed(Number.parseInt(this.props.precision, 10));
    }
    const {show} = this.state;
    return (
      <div style={this.props.style} className={`${this.props.className} popinput-input-container`}>
        { this.props.name ?
          <span
            className={`popinput-input-label ${this.props.ref}`}
          >
            {this.props.name} :
          </span> : null
        }
        <span
          className={`popinput-input-value ${this.props.pkey}`}
        >
          { this.props.inplace ?
            <div>
              { popoverContent }
            </div>
            :
            <OverlayTrigger
              show={show}
              onHide={() => this.showOvelay(false)}
              id='popOverlayRef'
              trigger="focus"
              rootClose={true}
              placement={this.props.placement}
              overlay={popover}
            >
              <a
                ref={(ref) => { this.valueLabel = ref; }}
                key="valueLabel"
                className={`popinput-input-link ${linkClass} ${stateClass}`}
                onClick={() => this.showOvelay(!show)}
              >
                {value} {this.props.suffix}
              </a>
            </OverlayTrigger>
          }
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
  name: '',
  title: '',
  suffix: '',
  value: 0,
  style: {},
  placement: 'right',
  pkey: undefined,
  onSave: undefined,
  onCancel: undefined,
  data: { value: 0, state: 'ABORTED', msg: '', step: 0.1 }
};
