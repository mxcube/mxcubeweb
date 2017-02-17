import React from 'react';
import { Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import { RUNNING } from '../../constants';

export default class BeamlineActionControl extends React.Component {
  render() {
    const bsStyle = this.props.state === RUNNING ? 'danger' : 'primary';
    const label = this.props.state === RUNNING ? 'Stop' : 'Run';

    return (<ButtonToolbar>
              <Button bsSize="small" bsStyle={bsStyle} disabled={this.props.disabled}
                      onClick={()=>{ label === 'Run' ? this.props.start(this.props.cmdName) : this.props.stop(this.props.cmdName) }}>
                {label}
              </Button>
              <Button disabled={this.props.disabled} bsSize="small" onClick={()=>{ this.props.showOutput(this.props.cmdName) }}>
                <Glyphicon glyph="new-window" />
              </Button>
            </ButtonToolbar>);
  }
}

