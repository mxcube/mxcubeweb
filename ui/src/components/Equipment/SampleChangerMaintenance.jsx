import React from 'react';
import { Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import ActionGroup from './ActionGroup';
import ActionButton from './ActionButton';
import { sendCommand } from '../../actions/sampleChanger';
import styles from './equipment.module.css';

function SampleChangerMaintenance() {
  const dispatch = useDispatch();

  const { commands, commands_state, message } = useSelector(
    (state) => state.sampleChangerMaintenance,
  );

  const commandGroups = commands.cmds || [];

  return (
    <>
      {commandGroups.map(([grpLabel, grpCmds]) => (
        <ActionGroup key={grpLabel} label={grpLabel}>
          {grpCmds.map(([cmd, cmdLabel, , cmdArgs]) => (
            <ActionButton
              key={cmd}
              label={cmdLabel}
              disabled={!commands_state[cmd]}
              onSend={() => dispatch(sendCommand(cmd, cmdArgs))}
            />
          ))}
        </ActionGroup>
      ))}

      {message && (
        <Card className="mb-2">
          <Card.Header>Status message</Card.Header>
          <Card.Body>
            <span className={styles.scMessage}>{message}</span>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

export default SampleChangerMaintenance;
