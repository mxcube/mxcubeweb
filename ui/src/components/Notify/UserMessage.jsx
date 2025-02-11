import React from 'react';
import styles from './UserMessage.module.css';

export default function UserMessage(props) {
  const { messages } = props;

  function renderMessages() {
    const msg = [];

    for (const [idx, message] of messages.entries()) {
      const messageClass = `${styles.message} ${styles[message.severity]}`;

      msg.push(
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
          <span className={styles.messageText}>
            {`[${message.timestamp.slice(11, 19)}]: ${message.message}`}
          </span>
        </div>,
      );
    }
    return msg;
  }
  return (
    <div id="usermessages" className={styles.messageBody}>
      {renderMessages()}
    </div>
  );
}
