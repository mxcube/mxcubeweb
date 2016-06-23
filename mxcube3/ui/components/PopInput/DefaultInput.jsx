import React from 'react';

import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import { Button, Input, ButtonToolbar } from 'react-bootstrap';

import './style.css';

export default class DefaultInput extends React.Component {

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.submit = this.submit.bind(this);
  }


  getValue() {
    return this.refs.input.getValue();
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
      <form ref="popinput-form" className="form-inline" onSubmit={this.submit} noValidate>
        <Input ref="input" type={this.props.dataType} style={{ width: this.props.inputSize }}
          placeholder="" className="input-sm" defaultValue={this.props.value}
        />
        <ButtonToolbar style={{ 'margin-left': '0px' }}  className="form-group editable-buttons">
          <Button bsStyle="primary" className="btn-sm" onClick={this.save}>
            <i className="glyphicon glyphicon-ok" />
          </Button>
          <Button bsStyle="default" className="btn-sm" onClick={this.cancel}>
            <i className="glyphicon glyphicon-remove" />
          </Button>
        </ButtonToolbar>
      </form>
    );
  }
}


DefaultInput.defaultProps = {
  className: '',
  dataType: 'number',
  inputSize: '100px',
  value: 0,
  onSave: undefined,
  onCancel: undefined,
  onSubmit: undefined,
};
