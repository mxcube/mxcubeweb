import React from 'react';
import 'react-bootstrap-switch/src/less/bootstrap3/build.less';
import { Button, ButtonGroup } from 'react-bootstrap';

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
    let msgBgStyle = 'bg-warning';

    if (this.props.data.state === 'in') {
      msgBgStyle = 'bg-success';
    } else if (this.props.data.state === 'out') {
      msgBgStyle = 'bg-danger';
    }


    return (
      <div>
        <div className="">
          {this.props.labelText}
        </div>
        <ButtonGroup>
          <div className={`inout-switch-msg ${msgBgStyle}`}>{this.props.data.msg}</div>
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
