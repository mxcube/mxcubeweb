
import React from 'react';
import { Form, InputGroup, Button, ButtonToolbar } from 'react-bootstrap';
import NumericInput from 'react-numeric-input';
import { TiTick, TiTimes } from "react-icons/ti";

export default class DefaultInput extends React.Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.submit = this.submit.bind(this);
    this.formControlRef = React.createRef();
    this.inputRef = React.createRef();
  }

  getValue() {
    return this.formControlRef.current.state.value;
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
      <Form className="popinput" inline onSubmit={this.submit} noValidate>
        <InputGroup className='d-flex' >
          <NumericInput
            className="popinput-input"
            size="5"
            ref={this.formControlRef}
            precision={this.props.precision}
            value={this.props.value}
            step={this.props.step}
            
          />
          <ButtonToolbar style={{ marginLeft: '0px' }} className="ms-1 form-group editable-buttons">
            <Button variant="success" size='sm' onClick={this.save}>
              <TiTick size='1.5em' />
            </Button>
            { !this.props.inplace ? (
              <Button variant="outline-secondary" size='sm' className="ms-1" onClick={this.cancel}>
                <TiTimes size='1.5em' />
              </Button>
              ) : (null)
            }
          </ButtonToolbar>
        </InputGroup>
      </Form>
    );
  }
}


DefaultInput.defaultProps = {
  dataType: 'number',
  inputSize: '10',
  step: 0.1,
  inplace: false,
  precision: 3,
  value: 0,
  onSave: undefined,
  onCancel: undefined,
  onSubmit: undefined,
};