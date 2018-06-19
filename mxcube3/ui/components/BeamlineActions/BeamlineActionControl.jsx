import React from 'react';
import { Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import { RUNNING, twoStateActuatorIsActive, TWO_STATE_ACTUATOR } from '../../constants';

export default class BeamlineActionControl extends React.Component {
  render() {
    let bsStyle = this.props.state === RUNNING ? 'danger' : 'primary';
    let label = this.props.state === RUNNING ? 'Stop' : 'Run';
    const showOutput = this.props.type !== TWO_STATE_ACTUATOR;

    if (this.props.type === 'INOUT') {
      label = String(this.props.data).toUpperCase();
      bsStyle = twoStateActuatorIsActive(this.props.data) ? 'success' : 'danger';
    }

    return (<ButtonToolbar>
        { this.props.arguments.length === 0 ?
          <Button bsSize="small"
            bsStyle = {bsStyle}
            disabled = {this.props.disabled}
            onClick = { this.props.state !== RUNNING ?
                        () => this.props.start(this.props.cmdName, showOutput) :
                        () => this.props.stop(this.props.cmdName) }
          >
          <b>{label}</b>
          </Button> : ''
        }
	{ showOutput ?
          <Button
            disabled = {this.props.disabled}
            bsSize = "small"
            onClick = { () => this.props.showOutput(this.props.cmdName) }
          >
            <Glyphicon glyph="new-window" />
          </Button> : ''
	}
      </ButtonToolbar>);
  }
}

