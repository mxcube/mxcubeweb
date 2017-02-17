import React from 'react';
import { Row, Col, Label, Button } from 'react-bootstrap';


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
    let msgBgStyle = 'warning';
    if (this.props.data.state === 'in') {
      msgBgStyle = 'success';
    } else if (this.props.data.state === 'out') {
      msgBgStyle = 'danger';
    }

    let btn = <Button block bsSize="small" disabled>---</Button>;
    if (this.props.data.state === 'in') {
      btn = <Button block bsSize="small" onClick={this.setOut}>{this.props.offText}</Button>;
    } else if (this.props.data.state === 'out') {
      btn = <Button block bsSize="small" onClick={this.setIn}>{this.props.onText}</Button>;
    }

    return (
        <Row>
          <Col xs={12}>
            <Label style={{ display: 'block', marginBottom: '3px' }}>{this.props.labelText}</Label>
            <Label bsStyle={msgBgStyle} style={{ display: 'block', fontSize: '100%', borderRadius: '0px' }}>{this.props.data.msg}</Label>
            {btn}
          </Col>
        </Row>
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
