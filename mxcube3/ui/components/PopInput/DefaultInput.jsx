import React from 'react';

import { Form, Button, FormControl, ButtonToolbar } from 'react-bootstrap';

import './style.css';

export default class DefaultInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {value: this.props.value};
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.submit = this.submit.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  
  onChange(event) {
    this.setState({value: event.target.value});
  }

  getValue() {
    return this.state.value;
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
          ref={ ref => { this.input = ref; }}
          type={this.props.dataType}
          style={{ width: this.props.inputSize }}
          placeholder=""
          value={this.state.value}
          onChange={this.onChange}
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
