import React from 'react';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import styles from './inOutStyle.module.css';

export default class InOutSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.handleSetOff = this.handleSetOff.bind(this);
    this.handleSetOn = this.handleSetOn.bind(this);
  }

  handleSetOff() {
    if (this.props.onSave !== undefined) {
      if (this.props.offValue === undefined) {
        this.props.onSave(this.props.pkey, this.props.offText);
      } else if (this.props.pkey === undefined) {
        this.props.onSave(this.props.offValue);
      } else {
        this.props.onSave(this.props.pkey, this.props.offValue);
      }
    }
  }

  handleSetOn() {
    if (this.props.onSave !== undefined) {
      if (this.props.onValue === undefined) {
        this.props.onSave(this.props.pkey, this.props.onText);
      } else if (this.props.pkey === undefined) {
        this.props.onSave(this.props.onValue);
      } else {
        this.props.onSave(this.props.pkey, this.props.onValue);
      }
    }
  }

  renderLabel() {
    let optionsLabel = (
      <Badge className={styles.inOutLabel} bg="secondary">
        {this.props.labelText}
      </Badge>
    );

    if (this.props.optionsOverlay) {
      optionsLabel = (
        <OverlayTrigger
          rootClose
          trigger="click"
          placement="bottom"
          overlay={this.props.optionsOverlay}
        >
          <div>
            <Badge bg="secondary" className={styles.inOutLabel}>
              {this.props.labelText}
              <i className="fas fa-cog ms-2" />
            </Badge>
          </div>
        </OverlayTrigger>
      );
    }

    if (this.props.btnLabel) {
      return null;
    }

    return optionsLabel;
  }

  render() {
    let msgBgStyle = 'warning';

    let btn = (
      <Button variant="outline-secondary" size="sm" disabled>
        ---
      </Button>
    );

    switch (this.props.data.value) {
      case this.props.onText:
      case 'READY': {
        msgBgStyle = 'success';
        btn = (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={this.handleSetOff}
          >
            Set: {this.props.offText}
          </Button>
        );
        break;
      }
      case this.props.offText:
      case 'CLOSED': {
        msgBgStyle = 'danger';
        btn = (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={this.handleSetOn}
          >
            Set: {this.props.onText}
          </Button>
        );
        break;
      }
      case 'DISABLED': {
        msgBgStyle = 'warning';
        btn = (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={this.handleSetOn}
          >
            Set: {this.props.offText}
          </Button>
        );
        break;
      }
      // No default
    }

    return (
      <div className={styles.inOutSwitch}>
        {this.renderLabel()}
        <OverlayTrigger
          rootClose
          trigger="click"
          placement={this.props.overlayPlacement || 'bottom'}
          overlay={
            <Popover
              style={{ padding: '0.5em' }}
              id={`${this.props.labelText} popover`}
            >
              {btn}
            </Popover>
          }
        >
          {!this.props.btnLabel ? (
            <div title={this.props.data.value}>
              <Badge bg={msgBgStyle} className={styles.msgLabelStyle}>
                {this.props.data.value}
              </Badge>
            </div>
          ) : (
            <Button variant="outline-secondary" className={styles.SwitchBtn}>
              {this.props.labelText}{' '}
              <Badge className={styles.SwitchBdg} bg={msgBgStyle} style={{}}>
                {this.props.data.value}
              </Badge>
            </Button>
          )}
        </OverlayTrigger>
      </div>
    );
  }
}

InOutSwitch.defaultProps = {
  onText: 'Open',
  offText: 'Close',
  onValue: undefined,
  offValue: undefined,
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: { value: 'undefined', state: 'IN', msg: 'UNKNOWN' },
};
