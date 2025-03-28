import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack } from 'react-bootstrap';
import { Outlet, useLocation } from 'react-router-dom';

import TaskContainer from '../containers/TaskContainer';
import PleaseWaitDialog from '../containers/PleaseWaitDialog';
import ErrorNotificationPanel from '../containers/ErrorNotificationPanel';
import ResumeQueueDialog from '../containers/ResumeQueueDialog';
import ConnectionLostDialog from '../containers/ConnectionLostDialog';
import ObserverDialog from './RemoteAccess/ObserverDialog';
import PassControlDialog from './RemoteAccess/PassControlDialog';
import ConfirmCollectDialog from '../containers/ConfirmCollectDialog';
import WorkflowParametersDialog from '../containers/WorkflowParametersDialog';
import GphlWorkflowParametersDialog from '../containers/GphlWorkflowParametersDialog';
import { LimsResultDialog } from './Lims/LimsResultDialog';
import LoadingScreen from './LoadingScreen/LoadingScreen';
import MXNavbar from './MXNavbar/MXNavbar';
import ChatWidget from './ChatWidget';
import ClearQueueDialog from './SampleGrid/ClearQueueDialog';
import SelectProposal from './LoginForm/SelectProposal';
import { getInitialState } from '../actions/login';
import { showDialog } from '../actions/general';
import diagonalNoise from '../img/diagonal-noise.png';
import styles from './Main.module.css';

import 'react-chat-widget/lib/styles.css';
import './rachat.css';

function Main() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const inControl = useSelector((state) => state.login.user.inControl);
  const general = useSelector((state) => state.general);

  useEffect(() => {
    dispatch(getInitialState());
  }, [dispatch]);

  const showReadOnlyDiv =
    !inControl && pathname !== '/remoteaccess' && pathname !== '/help';

  if (!general.applicationFetched) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.main}>
      {showReadOnlyDiv && (
        <div
          className={styles.readOnly}
          style={{ backgroundImage: `url(${diagonalNoise})` }}
        />
      )}

      <SelectProposal />
      <ClearQueueDialog />
      <TaskContainer />
      <PleaseWaitDialog />
      <ErrorNotificationPanel />
      <ResumeQueueDialog />
      <ConnectionLostDialog />
      <ObserverDialog />
      <PassControlDialog />
      <ConfirmCollectDialog />
      <WorkflowParametersDialog />
      <GphlWorkflowParametersDialog />
      <LimsResultDialog
        show={general.dialogType === 'LIMS_RESULT_DIALOG'}
        taskData={general.dialogData}
        onHide={() => dispatch(showDialog(false))}
      />

      <MXNavbar />

      <Stack className="mb-4" gap={2}>
        <Outlet />
      </Stack>

      <ChatWidget />
    </div>
  );
}

export default Main;
