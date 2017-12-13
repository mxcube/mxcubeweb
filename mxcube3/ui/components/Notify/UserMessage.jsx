import React from 'react';
import { Overlay } from 'react-bootstrap';

import './style.css';

export default class UserMessage extends React.Component {
  constructor(props) {
    super(props);
    this.hideMessage = this.hideMessage.bind(this);
    this.hideOverlay = this._hideOverlay.bind(this);
  }

  _exclude(message) {
    let include = true;

    // If modal window is shown, skip
    if (document.getElementsByClassName('modal in').length > 0) {
      include = false;
    }

    // Message have expired, duration time passed, skip !
    if (message.exp < new Date().getTime()) {
      include = false;
    }

    // Message is not for this component, skip !
    if (this.props.target && this.props.target !== message.target) {
      include = false;
    }

    // Filter function returns true for messages to exclude, skip !
    if (this.props.filter && this.props.filter(message)) {
      include = false;
    }

    return !include;
  }

  _hideOverlay() {
    let showOverlay = false;

    for (const message of this.props.messages) {
      // Message is not for this component or have have expired, skip !
      if (this._exclude(message)) {
        continue;
      }

      showOverlay = true;
      break;
    }

    if (this.refs.overlay && this.refs.overlay.props.show && !showOverlay) {
      this.forceUpdate();
    }
  }

  messageOnClick(mid, tid) {
    this.refs[mid].style.display = 'none';

    if (tid) {
      clearTimeout(tid);
    }

    this._hideOverlay();
  }

  hideMessage(mid) {
    if (this.refs[mid]) {
      this.refs[mid].style.display = 'none';
    }

    this._hideOverlay();
  }

  render() {
    const messages = [];
    let divId = 0;

    for (const message of this.props.messages) {
      const messageClass = `message message${message.level}`;
      let tid = undefined;

      if (message.duration) {
        tid = setTimeout(this.hideMessage, message.duration, message.id);
      }

      const clickHandler = this.messageOnClick.bind(this, message.id, tid);

      // Message is not for this component or have have expired, skip !
      if (this._exclude(message)) {
        continue;
      }

      messages.push((
        <div key={message.id} ref={message.id} className={messageClass}>
          <span className="messageText">
            {message.message}
          </span>
          { message.level !== 'INFO' ?
            (<span className="closebtn" onClick={clickHandler}>&times;</span>) : null
          }
        </div>
        ));

      divId++;
    }

    let show = messages.length > 0;

    // Handles the case when show is undefined, null or ''. We only want to
    // explicitly hide if show is set to false.
    if (this.props.show === false) {
      show = false;
    }

    return (
      <Overlay
        ref="overlay"
        show={show}
        container={this}
        placement={this.props.placement}
        target={this.props.domTarget}
      >
        <div id="usermessages"
          style={ {
            minWidth: '500px',
            maxWidth: '500px',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            display: 'block',
            position: 'absolute',
            zIndex: 1000 } }
        >
          {messages}
        </div>
      </Overlay>
    );
  }
}
