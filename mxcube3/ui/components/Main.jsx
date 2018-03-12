import React from 'react';
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
import { sendChatMessage, getAllChatMessages } from '../actions/remoteAccess.js';
import { Widget, addResponseMessage, addUserMessage } from 'react-chat-widget';
import './rachat.css';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleNewUserMessage = this.handleNewUserMessage.bind(this);
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
            this.props.location.pathname !== '/remoteaccess';

    return (
      <div>
        {showReadOnlyDiv ?
          (<div
            onMouseDown={this.handleClick}
            style={{
              backgroundImage: `url(${diagonalNoise})`,
              zIndex: 10000,
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
        <TaskContainer />
        <PleaseWaitDialog />
        <ErrorNotificationPanel />
        <ResumeQueueDialog />
        <ConnectionLostDialog />
        <ObserverDialog />
        <PassControlDialog />
        <ConfirmCollectDialog />
        <WorkflowParametersDialog />
        <MXNavbarContainer location={this.props.location} />
        <Grid fluid>
            {this.props.children}
        </Grid>
        { this.props.remoteAccess.observers.length > 0 ?
          (<Widget
            title="Chat"
            subtitle=""
            badge={2}
            handleNewUserMessage={this.handleNewUserMessage}
          />) : null
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess
  };
}

export default connect(
  mapStateToProps
)(Main);
