import React from 'react';
import {
  Badge,
  Button,
  OverlayTrigger,
  Popover,
  Spinner,
} from 'react-bootstrap';
import styles from './inOutStyle.module.css';

export default function InOutSwitch(props) {
  const {
    value,
    onSave,
    pkey,
    offText,
    openText,
    openValue,
    offValue,
    optionsOverlay,
    labelText,
    isBtnLabel,
    overlayPlacement,
  } = props;

  function handleSetOff() {
    if (onSave !== undefined) {
      if (pkey === undefined) {
        onSave(offValue);
      } else {
        onSave(pkey, offValue);
      }
    }
  }

  function handleSetOn() {
    if (onSave !== undefined) {
      if (pkey === undefined) {
        onSave(openValue);
      } else {
        onSave(pkey, openValue);
      }
    }
  }

  function renderLabel() {
    let optionsLabel = (
      <Badge className={styles.inOutLabel} bg="secondary">
        {labelText}
      </Badge>
    );

    if (optionsOverlay) {
      optionsLabel = (
        <OverlayTrigger
          rootClose
          trigger="click"
          placement="bottom"
          overlay={optionsOverlay}
        >
          <div>
            <Badge bg="secondary" className={styles.inOutLabel}>
              {labelText}
              <i className="fas fa-cog ms-2" />
            </Badge>
          </div>
        </OverlayTrigger>
      );
    }

    if (isBtnLabel) {
      return null;
    }

    return optionsLabel;
  }

  let msgBgStyle = 'warning';

  let btn = (
    <Button variant="outline-secondary" size="sm" disabled>
      ---
    </Button>
  );

  switch (value) {
    case openText:
    case 'READY': {
      msgBgStyle = 'success';
      btn = (
        <Button variant="outline-secondary" size="sm" onClick={handleSetOff}>
          Set: {offText}
        </Button>
      );
      break;
    }
    case offText:
    case 'CLOSED': {
      msgBgStyle = 'danger';
      btn = (
        <Button variant="outline-secondary" size="sm" onClick={handleSetOn}>
          Set: {openText}
        </Button>
      );
      break;
    }
    case 'DISABLED':
    case 'UNUSABLE': {
      msgBgStyle = 'warning';
      btn = (
        <Button variant="outline-secondary" size="sm" onClick={handleSetOn}>
          Set: {offText}
        </Button>
      );
      break;
    }
    case 'MOVING': {
      msgBgStyle = 'warning';
      btn = (
        <Spinner animation="border" variant="warning">
          <span className="visually-hidden">MOVING...</span>
        </Spinner>
      );
      break;
    }
    // No default
  }

  return (
    <div className={styles.inOutSwitch}>
      {renderLabel()}
      <OverlayTrigger
        rootClose
        trigger="click"
        placement={overlayPlacement || 'bottom'}
        overlay={
          <Popover style={{ padding: '0.5em' }} id={`${labelText} popover`}>
            {btn}
          </Popover>
        }
      >
        {!isBtnLabel ? (
          <div title={value}>
            <Badge bg={msgBgStyle} className={styles.msgLabelStyle}>
              {value}
            </Badge>
          </div>
        ) : (
          <Button variant="outline-secondary" className={styles.switchBtn}>
            {labelText}{' '}
            <Badge className={styles.switchBdg} bg={msgBgStyle}>
              {value}
            </Badge>
          </Button>
        )}
      </OverlayTrigger>
    </div>
  );
}
