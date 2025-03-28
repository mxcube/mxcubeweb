import { useState } from 'react';
import { Button, Card, Form, InputGroup } from 'react-bootstrap';

function ActionField(props) {
  const { headerMsg, label, inputType = 'text', btnLabel, onSubmit } = props;

  const [inputValue, setInputValue] = useState('');

  function handleInputChange(evt) {
    const { value } = evt.target;

    if (inputType === 'number') {
      setInputValue(value && Number(value));
    } else {
      setInputValue(value);
    }
  }

  return (
    <Card className="mb-2">
      <Card.Header>{headerMsg}</Card.Header>
      <Card.Body>
        <Form
          onSubmit={(evt) => {
            evt.preventDefault();
            onSubmit(inputValue);
          }}
        >
          <Form.Group>
            <Form.Label>{label}</Form.Label>
            <InputGroup>
              <Form.Control
                type={inputType}
                value={inputValue}
                required
                size="sm"
                style={{ width: '13em', flex: 'none' }}
                onChange={(e) => handleInputChange(e)}
              />
              <Button type="submit" variant="outline-secondary">
                {btnLabel}
              </Button>
            </InputGroup>
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default ActionField;
