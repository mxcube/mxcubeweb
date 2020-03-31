import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Grid } from 'react-bootstrap';
import MXNavbarContainer from '../containers/MXNavbarContainer';
import TaskContainer from '../containers/TaskContainer';
import PleaseWaitDialog from '../containers/PleaseWaitDialog';
import ErrorNotificationPanel from '../containers/ErrorNotificationPanel';
import ResumeQueueDialog from '../containers/ResumeQueueDialog';
import ConnectionLostDialog from '../containers/ConnectionLostDialog';
import ObserverDialog from './RemoteAccess/ObserverDialog';
import PassControlDialog from './RemoteAccess/PassControlDialog';
import ConfirmCollectDialog from '../containers/ConfirmCollectDialog';
import WorkflowParametersDialog from '../containers/WorkflowParametersDialog';
import diagonalNoise from '../img/diagonal-noise.png';
import { sendChatMessage, getAllChatMessages,
  resetChatMessageCount } from '../actions/remoteAccess';
import { Widget, addResponseMessage, addUserMessage } from 'react-chat-widget';
import { showDialog } from '../actions/general';
import { LimsResultDialog } from './Lims/LimsResultDialog';
import OneDPlotDialog from '../containers/OneDPlotDialog';

import 'react-chat-widget/lib/styles.css';
import './rachat.css';


class Main extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleNewUserMessage = this.handleNewUserMessage.bind(this);
    this.onChatContainerClick = this.onChatContainerClick.bind(this);
  }

  componentDidMount() {
    getAllChatMessages().then((json) => {
      json.messages.forEach((entry) => {
        if (entry.sid === this.props.remoteAccess.sid) {
          addUserMessage(`${entry.date} **You:** \n\n ${entry.message} \n\n`);
        } else {
          addResponseMessage(`${entry.date} **${entry.user}:** \n\n ${entry.message}`);
        }
      });
    });
  }

  onChatContainerClick() {
    this.props.resetChatMessageCount();
  }

  handleNewUserMessage(message) {
    sendChatMessage(message, this.props.remoteAccess.sid);
  }

  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  }

  render() {
    const showReadOnlyDiv = !this.props.remoteAccess.master &&
            this.props.location.pathname !== '/remoteaccess' &&
            this.props.location.pathname !== '/help';

    return (
      <div>
        {showReadOnlyDiv ?
          (<div
            onMouseDown={this.handleClick}
            style={{
              backgroundImage: `url(${diagonalNoise})`,
              zIndex: 9998,
              position: 'fixed',
              padding: 0,
              margin: 0,
              top: 50,
              left: 0,
              width: '100vw',
              height: '100vh'
            }}
          />) : null
          }
        <OneDPlotDialog sourceId="mockupscan"/>
        <TaskContainer />
        <PleaseWaitDialog />
        <ErrorNotificationPanel />
        <ResumeQueueDialog />
        <ConnectionLostDialog />
        <ObserverDialog />
        <PassControlDialog />
        <ConfirmCollectDialog />
        <WorkflowParametersDialog />
        <LimsResultDialog
          show={this.props.general.dialogType === 'LIMS_RESULT_DIALOG'}
          taskData={this.props.general.dialogData}
          onHide={() => this.props.showDialog(false)}
        />
        <MXNavbarContainer location={this.props.location} />
        <Grid fluid>
            {this.props.children}
        </Grid>
        <span onClick={this.onChatContainerClick}>
          { this.props.remoteAccess.observers.length > 0 ?
            (<Widget
              title="Chat"
              subtitle=""
              badge={this.props.remoteAccess.chatMessageCount}
              handleNewUserMessage={this.handleNewUserMessage}
            />) : null
          }
        </span>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
    general: state.general
  };
}

function mapDispatchToProps(dispatch) {
  return {
    resetChatMessageCount: bindActionCreators(resetChatMessageCount, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch)
  };
}


export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main);
