import { Alert, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { showErrorPanel } from '../actions/general';

function ErrorNotificationPanel() {
  const dispatch = useDispatch();

  const show = useSelector((state) => state.general.showErrorPanel);
  const message = useSelector((state) => state.general.errorMessage);

  return (
    <Modal
      show={show}
      onHide={() => dispatch(showErrorPanel(false))}
      data-default-styles
    >
      <div style={{ marginBottom: '-20px' }}>
        <Alert
          variant="danger"
          onClose={() => dispatch(showErrorPanel(false))}
          dismissible
        >
          <strong>Error:&nbsp;</strong>
          {message}
        </Alert>
      </div>
    </Modal>
  );
}

export default ErrorNotificationPanel;
