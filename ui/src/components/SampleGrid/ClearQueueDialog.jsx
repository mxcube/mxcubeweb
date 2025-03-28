import ConfirmActionDialog from '../GenericDialog/ConfirmActionDialog';
import { useDispatch, useSelector } from 'react-redux';
import { clearQueue } from '../../actions/queue';
import { showConfirmClearQueueDialog } from '../../actions/general';

function ClearQueueDialog() {
  const dispatch = useDispatch();
  const show = useSelector(
    (state) => state.general.showConfirmClearQueueDialog,
  );

  return (
    <ConfirmActionDialog
      title="Clear sample list?"
      okBtnLabel="Clear"
      show={show}
      onOk={() => dispatch(clearQueue())}
      onHide={() => dispatch(showConfirmClearQueueDialog(false))}
    >
      This will also <strong>clear the queue</strong>.
    </ConfirmActionDialog>
  );
}

export default ClearQueueDialog;
