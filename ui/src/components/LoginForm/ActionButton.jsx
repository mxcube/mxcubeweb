import { Button } from 'react-bootstrap';

function ActionButton(props) {
  const { selectedSession, onClick } = props;

  if (!selectedSession) {
    return (
      <Button variant="primary" disabled data-default-styles>
        Select Proposal
      </Button>
    );
  }

  if (!selectedSession.is_scheduled_beamline) {
    return (
      <Button variant="danger" data-default-styles onClick={onClick}>
        Move here
      </Button>
    );
  }

  if (!selectedSession.is_scheduled_time) {
    return (
      <Button variant="warning" data-default-styles onClick={onClick}>
        Reschedule
      </Button>
    );
  }

  return (
    <Button variant="primary" data-default-styles onClick={onClick}>
      Select {selectedSession.code}-{selectedSession.number}
    </Button>
  );
}

export default ActionButton;
