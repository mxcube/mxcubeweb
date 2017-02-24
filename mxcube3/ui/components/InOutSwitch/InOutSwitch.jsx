import React from 'react';
import { Button, ButtonGroup, OverlayTrigger, Popover } from 'react-bootstrap';

import './style.css';


export default class InOutSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.setIn = this.setIn.bind(this);
    this.setOut = this.setOut.bind(this);
  }


  shouldComponentUpdate(nextProps) {
    return nextProps.data !== this.props.data;
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
        <div className="inout-label">
          {this.props.labelText}
        </div>
        <OverlayTrigger
          placement="bottom"
          overlay={(<Popover id={this.props.labelText}>
                      {this.props.labelText} is:
                      <div className={`inout-switch-msg ${msgBgStyle}`}>
                        {this.props.data.msg}
                      </div>
                    </Popover>)}
        >
        <ButtonGroup>

          <Button
            className=""
            bsStyle={inButtonStyle}
            bsSize="small"
            onClick={this.setIn}
            active={isIn}
          >
            {this.props.onText}
          </Button>
          <Button
            bsStyle={outButtonStyle}
            bsSize="small"
            className=""
            onClick={this.setOut}
            active={!isIn}
          >
            {this.props.offText}
          </Button>
        </ButtonGroup>
        </OverlayTrigger>
      </div>
    );
  }
}


InOutSwitch.defaultProps = {
  onText: 'Open',
  offText: 'Close',
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: { value: 'undefined', state: 'IN', msg: 'UNKNOWN' }
};
