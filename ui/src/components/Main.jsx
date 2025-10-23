import { useEffect } from 'react';
import { Stack } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';

import { getInitialState } from '../actions/login';
import ConfirmCollectDialog from '../containers/ConfirmCollectDialog';
import ConnectionLostDialog from '../containers/ConnectionLostDialog';
import ErrorNotificationPanel from '../containers/ErrorNotificationPanel';
import GphlWorkflowParametersDialog from '../containers/GphlWorkflowParametersDialog';
import PleaseWaitDialog from '../containers/PleaseWaitDialog';
import ResumeQueueDialog from '../containers/ResumeQueueDialog';
import TaskContainer from '../containers/TaskContainer';
import WorkflowParametersDialog from '../containers/WorkflowParametersDialog';
import diagonalNoise from '../img/diagonal-noise.png';
import ChatWidget from './ChatComponent/ChatComponent';
import { DataCollectionResultDialog } from './DataCollectionResult/DataCollectionResultDialog';
import LoadingScreen from './LoadingScreen/LoadingScreen';
import SelectProposal from './LoginForm/SelectProposal';
import styles from './Main.module.css';
import MXNavbar from './MXNavbar/MXNavbar';
import ObserverDialog from './RemoteAccess/ObserverDialog';
import PassControlDialog from './RemoteAccess/PassControlDialog';
import ClearQueueDialog from './SampleGrid/ClearQueueDialog';

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
      <DataCollectionResultDialog />

      <MXNavbar />

      <Stack className="mb-4" gap={2}>
        <Outlet />
      </Stack>

      <ChatWidget />
    </div>
  );
}

export default Main;
