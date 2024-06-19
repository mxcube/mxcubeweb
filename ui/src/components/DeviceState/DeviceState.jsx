import React from 'react';
import { Badge } from 'react-bootstrap';

import styles from './deviceState.module.css';

export default class DeviceState extends React.Component {
  render() {
    let msgBgStyle = 'warning';

    if (this.props.data === 'READY') {
      msgBgStyle = 'info';
    }

    return (
      <div className={styles.deviceState}>
        <Badge className={styles.labelStyle} bg="secondary">
          {this.props.labelText}
        </Badge>
        <Badge className={styles.msgLabelStyle} bg={msgBgStyle}>
          {this.props.data}
        </Badge>
      </div>
    );
  }
}

DeviceState.defaultProps = {
  labelText: '',
  pkey: undefined,
  data: 'UNKNOWN',
};
