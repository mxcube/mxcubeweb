import { Modal, Button } from 'react-bootstrap';

function ConfirmActionDialog(props) {
  const {
    title,
    okBtnLabel = 'OK',
    cancelBtnLabel = 'Cancel',
    show = false,
    children,
    onHide,
    onOk,
    onCancel,
  } = props;

  return (
    <Modal show={show} data-default-styles onHide={onHide}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button
          variant="warning"
          onClick={() => {
            onOk?.();
            onHide();
          }}
        >
          {okBtnLabel}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => {
            onCancel?.();
            onHide();
          }}
        >
          {cancelBtnLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmActionDialog;
