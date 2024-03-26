import React, { useState } from 'react';
import { Button, InputGroup, ButtonGroup, Card, Form } from 'react-bootstrap';

export function ActionGroup(props) {
  return (
    <Card className="mb-2">
      <Card.Header>{props.name}</Card.Header>
      <Card.Body>
        <ButtonGroup>{props.buttons}</ButtonGroup>
      </Card.Body>
    </Card>
  );
}

export function ActionButton(props) {
  let disabled;

  if (props.enabled === true) {
    disabled = false;
  } else {
    disabled = true;
  }

  return (
    <Button
      disabled={disabled}
      onClick={() => props.sendCommand(props.cmd, props.args)}
      size="sm"
      className="me-2"
      variant={props.variant || 'outline-secondary'}
    >
      {props.label}
    </Button>
  );
}

export function ActionField(props) {
  const [inputValue, setInputValue] = useState(null);

  function handleInputChange(e) {
    if (props.inputType === 'number') {
      setInputValue(Number(e.target.value));
    } else {
      setInputValue(e.target.value);
    }
  }

  function actionComponent() {
    return (
      <span>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            props.sendCommand(props.cmd, inputValue);
          }}
        >
          <Form.Group size="sm">
            <Form.Label>{props.label}</Form.Label>
            <br />
            <InputGroup>
              <Form.Control
                size="sm"
                required
                value={inputValue}
                style={{
                  maxWidth: '13em',
                  minWidth: '13em',
                  marginRight: '0.2em',
                }}
                type={props.inputType}
                onChange={(e) => {
                  handleInputChange(e);
                }}
              />
              <Button type="submit" size="sm">
                {props.btn_label}
              </Button>
            </InputGroup>
          </Form.Group>
        </Form>
      </span>
    );
  }

  return (
    <ActionGroup
      name={`${props.header_msg} : ${props.value}`}
      buttons={actionComponent()}
    />
  );
}
