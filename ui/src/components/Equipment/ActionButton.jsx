import { Button } from 'react-bootstrap';

function ActionButton(props) {
  const { label, disabled, onSend } = props;
  return (
    <Button
      className="me-2"
      size="sm"
      variant="outline-secondary"
      disabled={disabled}
      onClick={() => onSend()}
    >
      {label}
    </Button>
  );
}

export default ActionButton;
