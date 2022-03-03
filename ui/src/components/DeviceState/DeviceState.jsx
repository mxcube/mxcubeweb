import React from 'react';
import { Label } from 'react-bootstrap';

export default class DeviceState extends React.Component {
  render() {
    let msgBgStyle = 'warning';

    if (this.props.data === 'READY') {
      msgBgStyle = 'info';
    }

    const msgLabelStyle = {
      display: 'block',
      fontSize: '100%',
      borderRadius: '0px',
      color: '#000',
    };

    return (
      <div>
        <Label style={{ display: 'block', marginBottom: '3px' }}>
          {this.props.labelText}
        </Label>
        <Label bsStyle={msgBgStyle} style={msgLabelStyle}>
          {this.props.data}
        </Label>
      </div>
    );
  }
}

DeviceState.defaultProps = {
  labelText: '',
  pkey: undefined,
  data: 'UNKNOWN',
};
