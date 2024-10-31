/* eslint-disable react/no-string-refs */
import React from 'react';
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
    if (document.querySelectorAll('.modal.in').length > 0) {
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

  messageOnClick(mid) {
    this.refs[mid].style.display = 'none';
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

    for (const [idx, message] of this.props.messages.entries()) {
      const messageClass = `message message${message.severity}`;

      // Message is not for this component or have have expired, skip !
      if (this._exclude(message)) {
        continue;
      }

      messages.push(
        <div
          key={`${message.id}-${idx}`}
          ref={message.id}
          className={messageClass}
        >
          {message.severity === 'INFO' ? (
            <span className="fas fa-lg fa-check-circle" />
          ) : (
            <span className="fas fa-lg fa-exclamation-circle" />
          )}
          <span className="messageText">
            {`[${message.timestamp.slice(11, 19)}]: ${message.message}`}
          </span>
        </div>,
      );
    }

    return (
      <div
        id="usermessages"
        style={{
          position: 'flex',
          justifyContent: 'flex-end',
          flexDirection: 'column-reverse',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          display: 'flex',
          zIndex: 1000,
        }}
      >
        {messages}
      </div>
    );
  }
}
