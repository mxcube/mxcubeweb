import { useSelector } from 'react-redux';

import styles from './UserMessage.module.css';

export default function UserMessage() {
  const messages = useSelector((state) => state.logger.logRecords);

  return (
    <div id="usermessages" className={styles.messageBody}>
      {[...messages].reverse().map((message) => (
        <div
          key={`${message.timestamp}`}
          className={`${styles.message} ${styles[message.severity]}`}
        >
          {message.severity === 'INFO' ? (
            <span className="fas fa-lg fa-check-circle" />
          ) : (
            <span className="fas fa-lg fa-exclamation-circle" />
          )}
          <span className={styles.messageText}>
            {`[${message.timestamp.slice(11, 19)}]: ${message.message}`}
          </span>
        </div>
      ))}
    </div>
  );
}
