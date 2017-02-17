import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

import './style.css';


export default class InOutSwitch2 extends React.Component {
  constructor(props) {
    super(props);
    this.setIn = this.setIn.bind(this);
    this.setOut = this.setOut.bind(this);
  }


  setIn() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, 'in');
    }
  }


  setOut() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, 'out');
    }
  }


  render() {
    const isIn = this.props.data.state === 'in';

    const inButtonStyle = isIn ? 'success' : 'default';
    const outButtonStyle = isIn ? 'default' : 'success';
    let msgBgStyle = 'input-bg-moving';
    if (this.props.data.state === 'in') {
      msgBgStyle = 'input-bg-ready';
    } else if (this.props.data.state === 'out') {
      msgBgStyle = 'input-bg-fault';
    }

    return (
      <div>
        <div className="row" style={{ paddingTop: '0em', padding: '0.5em' }}>
          <div className="inout-label">
            {this.props.labelText}:
          </div>
          <div className={`inout-switch-msg ${msgBgStyle}`}>
            {this.props.data.msg}
          </div>
        </div>
        <div className="row" style={{ 'text-align': 'center' }}>
        <ButtonGroup>
          <Button
            className=""
            bsStyle={inButtonStyle}
            bsSize="small"
            onClick={this.setIn}
            active={isIn}
            disabled={isIn}
          >
            {this.props.onText}
          </Button>
          <Button
            bsStyle={outButtonStyle}
            bsSize="small"
            className=""
            onClick={this.setOut}
            active={!isIn}
            disabled={!isIn}
          >
            {this.props.offText}
          </Button>
        </ButtonGroup>
        </div>
      </div>
    );
  }
}


InOutSwitch2.defaultProps = {
  onText: 'Open',
  offText: 'Close',
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: { value: 'undefined', state: 'IN', msg: 'UNKNOWN' }
};
