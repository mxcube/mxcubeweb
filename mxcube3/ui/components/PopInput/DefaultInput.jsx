import React from 'react';

import { Form, Button, FormControl, ButtonToolbar } from 'react-bootstrap';

import './style.css';

export default class DefaultInput extends React.Component {

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.submit = this.submit.bind(this);
  }


  getValue() {
    return this.refs.formControl.refs.input.value;
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
      <Form inline onSubmit={this.submit}>
        <FormControl
          ref="formControl"
          inputRef="input"
          type={this.props.dataType}
          style={{ width: this.props.inputSize }}
          placeholder=""
          defaultValue={this.props.value}
        />
        <ButtonToolbar style={{ marginLeft: '0px' }} className="form-group editable-buttons">
          <Button bsStyle="primary" className="btn-sm" onClick={this.save}>
            <i className="glyphicon glyphicon-ok" />
          </Button>
          <Button bsStyle="default" className="btn-sm" onClick={this.cancel}>
            <i className="glyphicon glyphicon-remove" />
          </Button>
        </ButtonToolbar>
      </Form>
    );
  }
}


DefaultInput.defaultProps = {
  dataType: 'number',
  inputSize: '100px',
  value: 0,
  onSave: undefined,
  onCancel: undefined,
  onSubmit: undefined,
};
