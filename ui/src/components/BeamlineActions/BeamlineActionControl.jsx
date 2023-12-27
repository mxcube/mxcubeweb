import React from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';
import { BiLinkExternal } from "react-icons/bi";
import { RUNNING, twoStateActuatorIsActive, TWO_STATE_ACTUATOR } from '../../constants';

export default class BeamlineActionControl extends React.Component {
  render() {
    let variant = this.props.state === RUNNING ? 'danger' : 'primary';
    let label = this.props.state === RUNNING ? 'Stop' : 'Run';
    const showOutput = this.props.type !== TWO_STATE_ACTUATOR;

    if (this.props.type === 'INOUT') {
      label = String(this.props.data).toUpperCase();
      variant = twoStateActuatorIsActive(this.props.data) ? 'success' : 'danger';
    }

    return (
      <ButtonToolbar>
        { this.props.arguments.length === 0 ?
          <Button
            size="sm"
            className='me-1'
            variant = {variant}
            disabled = {this.props.disabled}
            onClick = { this.props.state !== RUNNING ?
              () => this.props.start(this.props.cmdName, showOutput) :
              () => this.props.stop(this.props.cmdName) }
          >
          {label}
          </Button> : ''
        }
        { showOutput ?
          <Button
            variant='outline-secondary'
            disabled = {this.props.disabled}
            size = "sm"
            onClick = { () => this.props.showOutput(this.props.cmdName) }
          >
            <BiLinkExternal />
          </Button> : ''
        }
      </ButtonToolbar>);
  }
}

