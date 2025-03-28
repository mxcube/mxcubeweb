import { useSelector } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';

export function ConnectionLostDialog() {
  const show = useSelector((state) => state.general.showConnectionLostDialog);

  return (
    <Modal show={show}>
      <Modal.Header>
        <Modal.Title>Connection lost</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Trying to reconnect now...
        <br />
        If the issue persists, please check your Internet connection or reload
        the page.
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => window.location.reload(true)}> Reload </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConnectionLostDialog;
