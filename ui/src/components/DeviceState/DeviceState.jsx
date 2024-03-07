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
        <Badge
          className={styles.labelStyle}
          bg="secondary"
          style={{ display: 'block', marginBottom: '3px' }}
        >
          {this.props.labelText}
        </Badge>
        <Badge bg={msgBgStyle} className={styles.msgLabelStyle}>
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
