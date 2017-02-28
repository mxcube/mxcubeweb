import React from 'react';
import MXNavbarContainer from '../containers/MXNavbarContainer';
import TaskContainer from '../containers/TaskContainer';
import PleaseWaitDialog from '../containers/PleaseWaitDialog';
import ErrorNotificationPanel from '../containers/ErrorNotificationPanel';
import ResumeQueueDialog from '../containers/ResumeQueueDialog';
import ConnectionLostDialog from '../containers/ConnectionLostDialog';
import ObserverDialog from './RemoteAccess/ObserverDialog';
import PassControlDialog from './RemoteAccess/PassControlDialog';
import ConfirmCollectDialog from '../containers/ConfirmCollectDialog';

export default class Main extends React.Component {
  render() {
    return (
      <div>
        <TaskContainer />
        <PleaseWaitDialog />
        <ErrorNotificationPanel />
        <ResumeQueueDialog />
        <ConnectionLostDialog />
        <ObserverDialog />
        <PassControlDialog />
        <ConfirmCollectDialog />
        <MXNavbarContainer location={this.props.location} />
        <div className="container-fluid o-wrapper" id="o-wrapper">
          <div className="row">
            <div className="col-xs-12 main-content">
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
