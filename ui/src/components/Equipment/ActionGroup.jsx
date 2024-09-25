import React from 'react';
import { ButtonGroup, Card } from 'react-bootstrap';

function ActionGroup(props) {
  const { label, children } = props;
  return (
    <Card className="mb-2">
      <Card.Header>{label}</Card.Header>
      <Card.Body>
        <ButtonGroup>{children}</ButtonGroup>
      </Card.Body>
    </Card>
  );
}

export default ActionGroup;
