import React, { useState } from 'react';
import { Modal, Button, Tabs, Tab, Form } from 'react-bootstrap';
import SessionTable from './SessionTable';
import { useDispatch, useSelector } from 'react-redux';
import {
  hideProposalsForm,
  selectProposal,
  signOut,
} from '../../actions/login';
import styles from './SessionTable.module.css';
import ActionButton from './ActionButton';

function SelectProposal() {
  const dispatch = useDispatch();

  const login = useSelector((state) => state.login);
  const { loginType, proposalList, selectedProposalID, showProposalsForm } =
    login;

  const show =
    showProposalsForm || (loginType === 'User' && selectedProposalID === null);

  const [selectedSession, setSelectedSession] = useState(
    proposalList.find((s) => s.session_id === selectedProposalID),
  );
  const selectedSessionId = selectedSession ? selectedSession.session_id : null;

  const [filter, setFilter] = useState('');
  const filteredSessions = proposalList.filter(
    ({ title, number, code }) =>
      title.includes(filter) ||
      number.includes(filter) ||
      code.includes(filter),
  );

  filteredSessions.sort(
    (a, b) => (a.actual_start_date < b.actual_start_date ? 1 : -1), // sort by start date
  );

  const scheduledSessions = filteredSessions.filter(
    (s) => s.is_scheduled_beamline && s.is_scheduled_time,
  );
  const unscheduledSessions = filteredSessions.filter(
    (s) => s.is_scheduled_beamline && !s.is_scheduled_time,
  );
  const otherBeamlineSessions = filteredSessions.filter(
    (s) => !s.is_scheduled_beamline && s.is_scheduled_time,
  );
  function handleHide() {
    if (selectedProposalID === null) {
      dispatch(signOut());
    } else {
      dispatch(hideProposalsForm());
    }
  }

  return (
    <Modal
      show={show}
      backdrop={showProposalsForm || 'static'}
      onHide={() => {
        if (showProposalsForm) {
          handleHide();
        }
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Select a session</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          type="text"
          className="mb-3"
          placeholder="Filter"
          aria-label="Filter sessions"
          value={filter}
          onChange={(evt) => setFilter(evt.target.value)}
        />

        <Tabs id="scheduled-tab" defaultActiveKey="scheduled">
          <Tab eventKey="active" title={`Active (${scheduledSessions.length})`}>
            <div className={styles.table}>
              <SessionTable
                sessions={scheduledSessions}
                selectedSessionId={selectedSessionId}
                onSessionSelected={setSelectedSession}
              />
            </div>
          </Tab>
          <Tab
            eventKey="scheduled"
            title={`Scheduled (${unscheduledSessions.length})`}
          >
            <div className={styles.table}>
              <SessionTable
                showBeamline
                sessions={unscheduledSessions}
                selectedSessionId={selectedSessionId}
                onSessionSelected={setSelectedSession}
              />
            </div>
          </Tab>
          <Tab
            eventKey="other-unscheduled"
            title={`Other beamlines (${otherBeamlineSessions.length})`}
          >
            <div className={styles.table}>
              <SessionTable
                showBeamline
                sessions={otherBeamlineSessions}
                selectedSessionId={selectedSessionId}
                onSessionSelected={setSelectedSession}
              />
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <ActionButton
          selectedSession={selectedSession}
          onClick={() => dispatch(selectProposal(selectedSessionId))}
        />
        <Button
          variant="outline-secondary"
          data-default-styles
          onClick={() => handleHide()}
        >
          {showProposalsForm ? 'Cancel' : 'Sign out'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SelectProposal;
