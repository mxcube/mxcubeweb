import React from 'react';
import { OverlayTrigger, Popover, Badge, Row, Col } from 'react-bootstrap';

import styles from './machineInfoStyle.module.css';

function MachInfo(props) {
  const { info } = props;

  const tooltipTitle = 'Machine Status\n';

  let variant = 'info';
  let msg = '';
  let propName = '';
  let propValue = '';
  let popContent = '';

  if (info.attention === true) {
    variant = 'danger';
  } else {
    variant = 'info';
  }

  for (propName in info) {
    if (propName in info) {
      if (propName === 'attention') {
        continue;
      }
      propValue = info[propName];
      msg = (
        <Row className="mb-2">
          {' '}
          <Col sm={3}>{propName}</Col> <Col sm={1}> : </Col>{' '}
          <Col sm={7}>{propValue}</Col>
        </Row>
      );
      popContent = (
        <span>
          {popContent}
          {msg}
        </span>
      );
    }
  }

  popContent = <span>{popContent}</span>;

  const machineInfoPop = (
    <Popover id="popover-machineInfo">
      <Popover.Header>{tooltipTitle}</Popover.Header>
      <Popover.Body style={{ width: '400px' }}>{popContent}</Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger placement="bottom" overlay={machineInfoPop}>
      <div className={styles.machineInfo}>
        <Badge bg="secondary" className={styles.machineLabel}>
          Ring Current
        </Badge>
        <Badge bg={variant} className={styles.msgLabelStyle}>
          {info.current}
        </Badge>
      </div>
    </OverlayTrigger>
  );
}

MachInfo.defaultProps = {
  info: { current: -1, message: '' },
};

export default React.memo(MachInfo);
