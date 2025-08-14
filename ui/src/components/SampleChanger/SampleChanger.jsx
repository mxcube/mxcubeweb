import React from 'react';
import { Badge, Col, OverlayTrigger, Popover, Row } from 'react-bootstrap';

import styles from './sampleChangerStyle.module.css';

function SampleChanger(props) {
  const { state, maintenance } = props;
  const { global_state, message } = maintenance;
  const tooltipTitle = 'Sample Changer Status\n';

  let variant = 'info';
  let popContent = '';

  if (
    ['READY', 'LOADED', 'CHARGING', 'STANDBY'].includes(state.toUpperCase())
  ) {
    variant = 'success';
  } else if (['FAULT'].includes(state.toUpperCase())) {
    variant = 'danger';
  } else {
    variant = 'warning';
  }

  if (message) {
    global_state.Message = message;
  }
  Object.keys(global_state).forEach((propName) => {
    const propValue = global_state[propName];
    const popRow = (
      <Row className="mb-2">
        {' '}
        <Col sm={3}>{propName}</Col> <Col sm={1}> : </Col>{' '}
        <Col sm={7}>{propValue}</Col>
      </Row>
    );
    popContent = (
      <span>
        {popContent}
        {popRow}
      </span>
    );
  });
  popContent = <span>{popContent}</span>;

  const sampleChangerInfoPop = (
    <Popover id="popover-sampleChangerInfo">
      {Object.keys(global_state).length > 0 || message ? (
        <>
          <Popover.Header>{tooltipTitle}</Popover.Header>
          <Popover.Body style={{ width: '400px' }}>{popContent}</Popover.Body>
        </>
      ) : null}
    </Popover>
  );

  return (
    <OverlayTrigger placement="bottom" overlay={sampleChangerInfoPop}>
      <div className={styles.sampleChangerInfo}>
        <Badge className={styles.sampleChangerLabel} bg="secondary">
          Sample Changer
        </Badge>
        <Badge
          title={
            Object.keys(global_state).length > 0 || message ? undefined : state
          }
          className={styles.msgLabelStyle}
          bg={variant}
        >
          {state}
        </Badge>
      </div>
    </OverlayTrigger>
  );
}

SampleChanger.defaultProps = {
  maintenance: { global_state: {}, message: '' },
  state: 'UNKNOWN',
};

export default React.memo(SampleChanger);
