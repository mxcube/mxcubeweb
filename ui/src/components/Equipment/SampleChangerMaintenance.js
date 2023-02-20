import React from 'react';
import { Button, ButtonGroup, Card } from 'react-bootstrap';

import './SampleChanger.css';
 

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
        key={this.props.label}
        variant='outline-secondary'
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
      <Card className='mb-3'>
        <Card.Header>{this.props.name}</Card.Header>
        <Card.Body>
          <ButtonGroup>{this.props.buttons}</ButtonGroup>
        </Card.Body>
      </Card>
    );
  }
}

export default class SampleChangerMaintenance extends React.Component {
  buildActionButton(cmdinfo) {
    return React.createElement(SampleChangerActionButton,
      {
        label: cmdinfo[1],
        cmd: cmdinfo[0],
        args: cmdinfo[3],
        enabled: this.props.commands_state[cmdinfo[0]],
        send_command: this.props.send_command,
        key: cmdinfo[1]
      });
  }

  buildActionGroup(grpinfo) {
    const butgrp = [];

    for (const cmdinfo of grpinfo[1]) {
      butgrp.push(this.buildActionButton(cmdinfo));
    }

    return React.createElement(SampleChangerActionGroup,
      {
        name: grpinfo[0],
        buttons: butgrp,
        key: grpinfo[0]
      });
  }

  render() {
    const groups = [];
    let msg = '';

    if (Object.keys(this.props.commands).length > 0
        && this.props.commands.cmds !== 'SC maintenance controller not defined') {
      for (const cmdgrp of this.props.commands.cmds) {
        groups.push(this.buildActionGroup(cmdgrp));
      }
    } else {
      return (
        <div />
      );
    }


    if (this.props.message !== '') {
      msg = this.props.message;
    }

    return (
      <div>
        { groups }
        { msg ? (
          <Card className='mb-3'>
            <Card.Header>Status message</Card.Header>
            <Card.Body>
              <span className="scMessage">{ msg }</span>
            </Card.Body>
          </Card>
        ) : null
         }
      </div>
    );
  }
}
