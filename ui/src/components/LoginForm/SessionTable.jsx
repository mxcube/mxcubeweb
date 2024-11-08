import React from 'react';
import { Table } from 'react-bootstrap';
import { LuExternalLink } from 'react-icons/lu';
import styles from './SessionTable.module.css';
/**
 * Converts the date 20240931 into 31-09-2024
 * @param {*} dateString
 * @returns
 */
const formatDate = (dateString) => {
  // Extract year, month, and day from the string
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);

  // Format the date as "dd-mm-yyyy"
  return `${day}-${month}-${year}`;
};

const getDateComponent = (startDate, startTime) => {
  return (
    <>
      <span className={styles.date}>{formatDate(startDate)}</span>
      <span className={styles.time}>{startTime}</span>
    </>
  );
};

/**
 * Returns two blocs with the original date if it has been rescheduled and the actual date
 * @param {*} session
 * @param {*} startDate
 * @param {*} startTime
 * @returns
 */
const getScheduledDateComponent = (session, startDate, startTime) => {
  if (session.is_rescheduled) {
    return (
      <del className={styles.time}>
        {getDateComponent(startDate, startTime)}
      </del>
    );
  }
  return getDateComponent(startDate, startTime);
};

/**
 * Returns the anchor pointing to the date portal, user portal and logbook
 * @param {*} session
 * @returns
 */
const getLinkBySession = (session) => {
  return [
    { title: '', url: session.data_portal_URL },
    { title: '', url: session.user_portal_URL },
    { title: '', url: session.logbook_URL },
  ].map((item) => {
    return (
      <p key={item.url}>
        <a href={item.url} className="p-1" target="_blank" rel="noreferrer">
          <LuExternalLink /> {item.title}
        </a>
      </p>
    );
  });
};

/**
 * Given the session object will return the proposal name that correspond to {proposal_number}-{code}
 * @param {*} session
 * @returns
 */
const getProposalBySession = (session) => {
  return `${session.code}-${session.number}`;
};

export default function SessionTable(props) {
  return (
    <Table bordered hover size="sm" responsive>
      <thead>
        <tr>
          {props.params.showBeamline && <th>Beamline</th>}
          <th>Title</th>
          <th>Start</th>
          <th>End</th>
          <th>Portal</th>
          <th>User</th>
          <th>Logbook</th>
        </tr>
      </thead>
      <tbody>
        {props.sessions.map((session) => {
          const variant =
            props.selectedSessionId === session.session_id
              ? styles.selected_row
              : styles.unselected_row;

          return (
            <tr
              key={session.session_id}
              onClick={() => {
                props.onSessionSelected(session);
              }}
              className={variant}
            >
              <td>{getProposalBySession(session)}</td>
              {props.params.showBeamline && <td>{session.beamline_name}</td>}
              <td>{session.title}</td>
              <td>
                {getScheduledDateComponent(
                  session,
                  session.start_date,
                  session.start_time,
                )}
                <br />
                {session.is_rescheduled &&
                  getDateComponent(
                    session.actual_start_date,
                    session.actual_start_time,
                  )}
              </td>
              <td>
                {getScheduledDateComponent(
                  session,
                  session.end_date,
                  session.end_time,
                )}
                <br />
                {session.is_rescheduled &&
                  getDateComponent(
                    session.actual_end_date,
                    session.actual_end_time,
                  )}
              </td>
              <td>{getLinkBySession(session)[0]}</td>
              <td>{getLinkBySession(session)[1]}</td>
              <td>{getLinkBySession(session)[2]}</td>
            </tr>
          );
        })}
      </tbody>{' '}
    </Table>
  );
}
