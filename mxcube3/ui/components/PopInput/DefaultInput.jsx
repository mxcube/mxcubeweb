import React from 'react';
import ReactDOM from 'react-dom';
import { Form, Button, FormControl, ButtonToolbar } from 'react-bootstrap';

import './style.css';

export default class DefaultInput extends React.Component {

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.submit = this.submit.bind(this);
    this.stepIncrement = this.stepChange.bind(this, props.motorName, 1);
    this.stepDecrement = this.stepChange.bind(this, props.motorName, -1);
  }

  getValue() {
    const input = ReactDOM.findDOMNode(this.refs.formControl);
    return input.value;
  }


  stepChange(name, operator) {
    const input = ReactDOM.findDOMNode(this.refs.formControl);
    const nv = (Number(input.value) + this.props.step * operator).toFixed(this.props.precision);
    input.value = nv;
    input.defaultValue = nv;
  }


  save() {
    this.props.onSave();
  }


  cancel() {
    this.props.onCancel();
  }

  submit(event) {
    this.props.onSubmit(event);
  }

  render() {
    return (
      <Form inline onSubmit={this.submit} noValidate>
        <div className="rw-widget rw-numberpicker"
          style={ { width: Number(this.props.inputSize) + 10, display: 'inline-block' } }
        >
          <span className="rw-select">
            <button
              type="button"
              className="rw-btn"
              onClick={this.stepIncrement}
            >
              <i aria-hidden="true" className="rw-i rw-i-caret-up"></i>
            </button>
            <button
              type="button"
              className="rw-btn"
              onClick={this.stepDecrement}
            >
              <i aria-hidden="true" className="rw-i rw-i-caret-down"></i>
            </button>
          </span>
          <FormControl
            className="rw-input"
            style={ { width: this.props.inputSize } }
            ref="formControl"
            label="input"
            step="any"
            inputRef={(ref) => {this.input = ref;}}
            type={this.props.dataType}
            placeholder=""
            defaultValue={this.props.value}
          />
        </div>
        <ButtonToolbar style={{ marginLeft: '0px' }} className="form-group editable-buttons">
          <Button bsStyle="primary" className="btn-sm" onClick={this.save}>
            <i className="glyphicon glyphicon-ok" />
          </Button>
          { !this.props.inplace ?
            <Button bsStyle="default" className="btn-sm" onClick={this.cancel}>
              <i className="glyphicon glyphicon-remove" />
            </Button>
            :
            null
          }
        </ButtonToolbar>
      </Form>
    );
  }
}


DefaultInput.defaultProps = {
  dataType: 'number',
  inputSize: '110',
  step: 'any',
  precision: 1,
  value: 0,
  onSave: undefined,
  onCancel: undefined,
  onSubmit: undefined,
};
