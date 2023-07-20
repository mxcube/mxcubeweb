import React from 'react';
import { Form, InputGroup, Button, ButtonToolbar } from 'react-bootstrap';
import ReactNumericInput from 'react-numeric-input';
import { TiTick, TiTimes } from 'react-icons/ti';

export default class NumericInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.inputRef = React.createRef();
  }

  handleSubmit(evt) {
    evt.preventDefault();
    if (!this.props.busy) {
      this.props.onSubmit(this.inputRef.current.state.value);
    }
  }

  render() {
    return (
      <Form className="popinput" onSubmit={this.handleSubmit} noValidate>
        <InputGroup>
          {this.props.busy ? (
            <div className="popinput-input-busy" />
          ) : (
            <ReactNumericInput
              ref={this.inputRef}
              className="popinput-input"
              size={this.props.inputSize}
              precision={this.props.precision}
              value={this.props.value}
              step={this.props.step}
            />
          )}
          <ButtonToolbar className="ms-1">
            {!this.props.busy && (
              <Button type="submit" variant="success" size="sm">
                <TiTick size="1.5em" />
              </Button>
            )}
            {!this.props.inplace && (
              <Button
                variant={this.props.busy ? 'danger' : 'outline-secondary'}
                size="sm"
                className="ms-1"
                onClick={() => this.props.onCancel()}
              >
                <TiTimes size="1.5em" />
              </Button>
            )}
          </ButtonToolbar>
        </InputGroup>
      </Form>
    );
  }
}

NumericInput.defaultProps = {
  inputSize: '3',
  step: 0.1,
  inplace: false,
  precision: 3,
  value: 0,
  busy: false,
  onCancel: undefined,
  onSubmit: undefined,
};
