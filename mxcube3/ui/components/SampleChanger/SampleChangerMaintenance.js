import React from 'react';
import { Button, ButtonGroup, Panel } from 'react-bootstrap';

import './SampleChanger.css';
import '../context-menu-style.css';
/* eslint-disable react/no-multi-comp */

export class SampleChangerActionButton extends React.Component {
  constructor(props) {
    super(props);
    this.buttonClicked = this.buttonClicked.bind(this);
  }

  buttonClicked() {
    this.props.send_command(this.props.cmd);
  }

  render() {
    let disabled;

    if (this.props.enabled === true) {
      disabled = false;
    } else {
      disabled = true;
    }

    return (
        <Button bsStyle="default" disabled={disabled}
          onClick={() => this.props.send_command(this.props.cmd)}
        >
          {this.props.label}
        </Button>
    );
  }
}

export class SampleChangerActionGroup extends React.Component {
  render() {
    return (
      <Panel header={this.props.name}>
         <ButtonGroup>{this.props.buttons}</ButtonGroup>
      </Panel>
    );
  }
}

export default class SampleChangerMaintenance extends React.Component {
  buildActionButton(cmdinfo) {
    return React.createElement(SampleChangerActionButton,
                               { label: cmdinfo[1],
                                 cmd: cmdinfo[0],
                                 enabled: this.props.commands_state[cmdinfo[0]],
                                 send_command: this.props.send_command,
                               }
                              );
  }

  buildActionGroup(grpinfo) {
    const butgrp = [];

    for (const cmdinfo of grpinfo[1]) {
      butgrp.push(this.buildActionButton(cmdinfo));
    }

    return React.createElement(SampleChangerActionGroup,
                               { name: grpinfo[0],
                                 buttons: butgrp }
                              );
  }

  render() {
    const groups = [];
    let msg = '';

    if (Object.keys(this.props.commands).length !== 0 &&
        this.props.commands.cmds !== 'SC maintenance controller not defined') {
      for (const cmdgrp of this.props.commands.cmds) {
        groups.push(this.buildActionGroup(cmdgrp));
      }
    } else {
      return (
        <div>
        </div>
        );
    }


    if (this.props.message !== '') {
      msg = this.props.message;
    }

    return (
       <div>
         { groups }
         { msg ? (
           <Panel header="Status message">
             <span className="scMessage">{ msg }</span>
           </Panel>) : null
         }
       </div>
    );
  }
}

