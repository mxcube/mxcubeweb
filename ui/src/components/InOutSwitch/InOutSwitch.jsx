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
    // allValues: optional array of all valid state names (enables multi-state)
    allValues,
    optionsOverlay,
    invertBgColor = false,
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

  // Multi-state: build a button for each state that is not the current value.
  // Binary (no allValues): keep the original toggle logic.
  let btn;

  if (value === 'MOVING') {
    btn = (
      <Spinner animation="border" variant="warning">
        <span className="visually-hidden">MOVING...</span>
      </Spinner>
    );
  } else if (allValues && allValues.length > 2) {
    // Determine badge colour based on position in the allValues list.
    const idx = allValues.indexOf(value);
    if (idx === 0) {
      msgBgStyle = invertBgColor ? 'danger' : 'success';
    } else if (idx === 1) {
      msgBgStyle = invertBgColor ? 'success' : 'danger';
    } else {
      msgBgStyle = 'warning';
    }

    // Show one button per available target (excluding the current state).
    btn = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
        {allValues
          .filter((v) => v !== value)
          .map((v) => (
            <Button
              key={v}
              variant="outline-secondary"
              size="sm"
              onClick={() => handleSwitch(v)}
            >
              Set: {v}
            </Button>
          ))}
      </div>
    );
  } else {
    // Original binary toggle logic.
    btn = (
      <Button variant="outline-secondary" size="sm" disabled>
        ---
      </Button>
    );

    switch (value) {
      case openValue:
      case 'READY': {
        msgBgStyle = invertBgColor ? 'danger' : 'success';
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
        msgBgStyle = invertBgColor ? 'success' : 'danger';
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
      // No default
    }
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
