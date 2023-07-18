import React from 'react';

import { Button, Form, ButtonToolbar } from 'react-bootstrap';

import './style.css';

export default class DefaultInput extends React.Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.submit = this.submit.bind(this);
  }

  getValue() {
    return this.input.value;
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
      <Form
        ref="popinput-form"
        className="form-inline"
        onSubmit={this.submit}
        noValidate
      >
        <Form.Control
          ref={(ref) => {
            this.input = ref;
          }}
          style={{ width: this.props.inputSize }}
          placeholder=""
          defaultValue={this.props.value}
        />
        <ButtonToolbar
          style={{ 'margin-left': '0px' }}
          className="form-group editable-buttons"
        >
          <Button variant="primary" className="btn-sm" onClick={this.save}>
            <i className="glyphicon glyphicon-ok" />
          </Button>
          <Button
            variant="outline-secondary"
            className="btn-sm"
            onClick={this.cancel}
          >
            <i className="glyphicon glyphicon-remove" />
          </Button>
        </ButtonToolbar>
      </Form>
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
