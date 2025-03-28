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
    state,
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

  function handleSwitch(val) {
    if (onSave !== undefined) {
      if (pkey === undefined) {
        onSave(val);
      } else {
        onSave(pkey, val);
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
            <Badge className={styles.inOutLabel} bg="secondary">
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
    case openValue:
    case 'READY': {
      msgBgStyle = 'success';
      btn = (
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => handleSwitch(offValue)}
        >
          Set: {offText}
        </Button>
      );
      break;
    }
    case offValue:
    case 'DISABLED':
    case 'CLOSED': {
      msgBgStyle = 'danger';
      btn = (
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => handleSwitch(openValue)}
        >
          Set: {openText}
        </Button>
      );
      break;
    }
    case 'UNUSABLE': {
      msgBgStyle = 'warning';
      btn = (
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => handleSwitch(offValue)}
        >
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
          <Popover style={{ padding: '0.5em' }} id={`${labelText}_popover`}>
            {btn}
          </Popover>
        }
      >
        {!isBtnLabel ? (
          <div title={value}>
            <Badge className={styles.msgLabelStyle} bg={msgBgStyle}>
              {value}
            </Badge>
          </div>
        ) : (
          <Button variant="outline-secondary" className={styles.switchBtn}>
            {labelText}{' '}
            <Badge className={styles.switchBdg} bg={msgBgStyle}>
              {state}
            </Badge>
          </Button>
        )}
      </OverlayTrigger>
    </div>
  );
}
