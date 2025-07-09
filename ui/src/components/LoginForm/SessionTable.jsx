import { Table } from 'react-bootstrap';
import { LuExternalLink } from 'react-icons/lu';

import SessionDateTime from './SessionDateTime';
import styles from './SessionTable.module.css';

export default function SessionTable(props) {
  const {
    showBeamline = false,
    sessions,
    selectedSessionId,
    onSessionSelected,
  } = props;

  if (sessions.length === 0) {
    return <span className={styles.fallback}>No sessions</span>;
  }

  return (
    <Table bordered hover size="sm" responsive>
      <thead>
        <tr>
          <th scope="col">ID</th>
          {showBeamline && <th scope="col">Beamline</th>}
          <th scope="col">Title</th>
          <th scope="col">Start</th>
          <th scope="col">End</th>
          <th scope="col">Portal</th>
          <th scope="col">User</th>
          <th scope="col">Logbook</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => (
          <tr
            key={session.session_id}
            className={styles.row}
            data-selected={selectedSessionId === session.session_id}
            tabIndex={0}
            onClick={() => onSessionSelected(session)}
            onKeyDown={(evt) => {
              // For keyboard accessibility; ideally add "Select" button to each row instead of making rows clickable
              if (evt.key === 'Enter' || evt.key === ' ') {
                onSessionSelected(session);
              }
            }}
          >
            <td>{`${session.code}-${session.number}`}</td>
            {showBeamline && <td>{session.beamline_name}</td>}
            <td>{session.title}</td>
            <td>
              {session.is_rescheduled ? (
                <>
                  <del className={styles.time}>
                    <SessionDateTime
                      date={session.start_date}
                      time={session.start_time}
                    />
                  </del>
                  <br />
                  <SessionDateTime
                    date={session.actual_start_date}
                    time={session.actual_start_time}
                  />
                </>
              ) : (
                <SessionDateTime
                  date={session.start_date}
                  time={session.start_time}
                />
              )}
            </td>
            <td>
              {session.is_rescheduled ? (
                <>
                  <del className={styles.time}>
                    <SessionDateTime
                      date={session.end_date}
                      time={session.end_time}
                    />
                  </del>
                  <br />
                  <SessionDateTime
                    date={session.actual_end_date}
                    time={session.actual_end_time}
                  />
                </>
              ) : (
                <SessionDateTime
                  date={session.end_date}
                  time={session.end_time}
                />
              )}
            </td>
            <td>
              <a
                href={session.data_portal_URL}
                className="p-1"
                target="_blank"
                rel="noreferrer"
                aria-label="View session in Data Portal"
              >
                <LuExternalLink />
              </a>
            </td>
            <td>
              <a
                href={session.user_portal_URL}
                className="p-1"
                target="_blank"
                rel="noreferrer"
                aria-label="View session in User Portal"
              >
                <LuExternalLink />
              </a>
            </td>
            <td>
              <a
                href={session.logbook_URL}
                className="p-1"
                target="_blank"
                rel="noreferrer"
                aria-label="View session logbook"
              >
                <LuExternalLink />
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
