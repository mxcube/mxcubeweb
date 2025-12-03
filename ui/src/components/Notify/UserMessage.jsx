import { useSelector } from 'react-redux';

import styles from './UserMessage.module.css';

export default function UserMessage() {
  const messages = useSelector((state) => state.logger.logRecords);

  if (messages.length === 0) {
    return <div className={styles.empty}>No messages yet</div>;
  }

  return (
    <>
      {[...messages].reverse().map((msg) => {
        const { id, timestamp, message, severity } = msg;
        const icon =
          severity === 'INFO' ? 'fa-check-circle' : 'fa-exclamation-circle';

        return (
          <div key={id} className={styles.message} data-severity={severity}>
            <span className={`${styles.icon} fas fa-md ${icon} me-2`} />
            {`[${timestamp.slice(11, 19)}] ${message}`}
          </div>
        );
      })}
    </>
  );
}
