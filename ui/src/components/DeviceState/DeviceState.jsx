import React from 'react';
import { Badge } from 'react-bootstrap';

import styles from './deviceState.module.css';

function DeviceState(props) {
  const { labelText, data } = props;
  const msgBgStyle = data === 'READY' ? 'info' : 'warning';

  return (
    <div className={styles.deviceState}>
      {labelText && (
        <Badge className={styles.labelStyle} bg="secondary">
          {labelText}
        </Badge>
      )}
      {data && (
        <Badge className={styles.msgLabelStyle} bg={msgBgStyle}>
          {data}
        </Badge>
      )}
    </div>
  );
}

export default DeviceState;
