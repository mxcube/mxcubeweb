import React from 'react';
import { Card } from 'react-bootstrap';

import { ActionGroup, ActionButton } from './ActionGroup';

import styles from './equipment.module.css';

export default function SampleChangerMaintenance(props) {
  function renderActionButton(cmdinfo) {
    return (
      <ActionButton
        label={cmdinfo[1]}
        cmd={cmdinfo[0]}
        args={cmdinfo[3]}
        enabled={props.commands_state[cmdinfo[0]]}
        sendCommand={props.sendCommand}
        key={cmdinfo[1]}
        variant="outline-secondary"
      />
    );
  }

  function renderActionGroup(grpinfo) {
    const butgrp = [];

    for (const cmdinfo of grpinfo[1]) {
      butgrp.push(renderActionButton(cmdinfo));
    }

    return <ActionGroup name={grpinfo[0]} buttons={butgrp} key={grpinfo[0]} />;
  }

  const groups = [];
  let msg = '';

  if (
    Object.keys(props.commands).length > 0 &&
    props.commands.cmds !== 'SC maintenance controller not defined'
  ) {
    for (const cmdgrp of props.commands.cmds) {
      groups.push(renderActionGroup(cmdgrp));
    }
  } else {
    return <div />;
  }

  if (props.message !== '') {
    msg = props.message;
  }

  return (
    <div>
      {groups}
      {msg ? (
        <Card className="mb-2">
          <Card.Header>Status message</Card.Header>
          <Card.Body>
            <span className={styles.scMessage}>{msg}</span>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
}
