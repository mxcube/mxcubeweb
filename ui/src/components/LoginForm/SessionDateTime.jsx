import styles from './SessionTable.module.css';

function SessionDateTime(props) {
  const { date, time } = props;

  // Expected format: "20240931"
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);

  return (
    <time>
      {`${day}-${month}-${year}`}
      <span className={styles.time}>{time}</span>
    </time>
  );
}

export default SessionDateTime;
