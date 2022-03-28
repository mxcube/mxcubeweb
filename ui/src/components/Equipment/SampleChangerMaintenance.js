import React from 'react';
import { Button, ButtonGroup, Panel } from 'react-bootstrap';

import './SampleChanger.css';
import '../context-menu-style.css';
/* eslint-disable react/no-multi-comp */

export class SampleChangerActionButton extends React.Component {
  render() {
    let disabled;

    if (this.props.enabled === true) {
      disabled = false;
    } else {
      disabled = true;
    }

    return (
      <Button
        bsStyle="default"
        disabled={disabled}
        onClick={() => this.props.send_command(this.props.cmd, this.props.args)}
      >
        {this.props.label}
      </Button>
    );
  }
}

export class SampleChangerActionGroup extends React.Component {
  render() {
    return (
      <Panel>
        <Panel.Heading>{this.props.name}</Panel.Heading>
        <Panel.Body>
          <ButtonGroup>{this.props.buttons}</ButtonGroup>
        </Panel.Body>
      </Panel>
    );
  }
}

export default class SampleChangerMaintenance extends React.Component {
  buildActionButton(cmdinfo) {
    return React.createElement(SampleChangerActionButton, {
      label: cmdinfo[1],
      cmd: cmdinfo[0],
      args: cmdinfo[3],
      enabled: this.props.commands_state[cmdinfo[0]],
      send_command: this.props.send_command,
    });
  }

  buildActionGroup(grpinfo) {
    const butgrp = [];

    for (const cmdinfo of grpinfo[1]) {
      butgrp.push(this.buildActionButton(cmdinfo));
    }

    return React.createElement(SampleChangerActionGroup, {
      name: grpinfo[0],
      buttons: butgrp,
    });
  }

  render() {
    const groups = [];
    let msg = '';

    if (
      Object.keys(this.props.commands).length !== 0 &&
      this.props.commands.cmds !== 'SC maintenance controller not defined'
    ) {
      for (const cmdgrp of this.props.commands.cmds) {
        groups.push(this.buildActionGroup(cmdgrp));
      }
    } else {
      return <div />;
    }

    if (this.props.message !== '') {
      msg = this.props.message;
    }

    return (
      <div>
        {groups}
        {msg ? (
          <Panel>
            <Panel.Heading>Status message</Panel.Heading>
            <Panel.Body>
              <span className="scMessage">{msg}</span>
            </Panel.Body>
          </Panel>
        ) : null}
      </div>
    );
  }
}
