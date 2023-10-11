/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import './style.css';

export default class InOutSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.setOff = this.setOff.bind(this);
    this.setOn = this.setOn.bind(this);
    this.onLinkRightClick = this.onLinkRightClick.bind(this);
    this.onOptionsRightClick = this.onOptionsRightClick.bind(this);

    this.showLabelOvelay = this.showLabelOvelay.bind(this);
    this.showValueOvelay = this.showValueOvelay.bind(this);

    this.state = {
      showLabelOvelay: false,
      showValueOvelay: false,
    };
  }

  showLabelOvelay(value) {
    this.setState({
      showLabelOvelay: value,
    });
  }

  showValueOvelay(value) {
    this.setState({
      showValueOvelay: value,
    });
  }

  /**
   * Set Ovelay visibility to False
   *
   * @param {MouseEvent} e
   */
  onKeyDown(e) {
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (e.key) {
      case 'Escape': {
        this.showValueOvelay(false);
        this.showLabelOvelay(false);

        break;
      }
      // No default
    }
  }

  onLinkRightClick(e) {
    // this.overlay.handleToggle();
    this.showValueOvelay(!this.state.showValueOvelay);
    e.preventDefault();
  }

  onOptionsRightClick(e) {
    // this.optionsOverlay.handleToggle();
    this.showLabelOvelay(!this.state.showLabelOvelay);
    e.preventDefault();
  }

  setOff() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, this.props.offText);
    }

    // this.overlay.hide();
    this.showValueOvelay(false);
  }

  setOn() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, this.props.onText);
    }

    // this.overlay.hide();
    this.showValueOvelay(false);
  }

  renderLabel() {
    const { showLabelOvelay } = this.state;
    let optionsLabel = (
      <Badge bg="secondary" style={{ display: 'block', marginBottom: '3px' }}>
        {this.props.labelText}
      </Badge>
    );

    if (this.props.optionsOverlay) {
      optionsLabel = (
        <OverlayTrigger
          show={showLabelOvelay}
          rootClose
          trigger="click"
          placement="bottom"
          overlay={this.props.optionsOverlay}
        >
          <div
            onClick={() => this.showLabelOvelay(!showLabelOvelay)}
            onContextMenu={this.onOptionsRightClick}
          >
            <Badge
              bg="secondary"
              style={{ display: 'block', marginBottom: '3px' }}
            >
              {this.props.labelText}
              <i className="fas fa-cog ms-2" />
            </Badge>
          </div>
        </OverlayTrigger>
      );
    }

    return optionsLabel;
  }

  render() {
    const { showValueOvelay } = this.state;
    let msgBgStyle = 'warning';
    if (this.props.data.value === this.props.onText) {
      msgBgStyle = 'success';
    } else if (this.props.data.value === this.props.offText) {
      msgBgStyle = 'danger';
    }

    let btn = (
      <Button variant="outline-secondary" size="sm" disabled>
        ---
      </Button>
    );

    if (this.props.data.value === this.props.onText) {
      btn = (
        <Button variant="outline-secondary" size="sm" onClick={this.setOff}>
          Set: {this.props.offText}
        </Button>
      );
    } else {
      btn = (
        <Button variant="outline-secondary" size="sm" onClick={this.setOn}>
          Set: {this.props.onText}
        </Button>
      );
    }

    const msgLabelStyle = {
      display: 'block',
      fontSize: '100%',
      borderRadius: '0px',
      color: '#000',
    };

    return (
      <div className="inout-switch">
        {this.renderLabel()}
        <OverlayTrigger
          show={showValueOvelay}
          rootClose
          trigger="click"
          placement="bottom"
          overlay={
            <Popover
              style={{ padding: '0.5em' }}
              id={`${this.props.labelText} popover`}
            >
              {btn}
            </Popover>
          }
        >
          <div
            onClick={() => this.showValueOvelay(!showValueOvelay)}
            onContextMenu={this.onLinkRightClick}
          >
            <Badge bg={msgBgStyle} style={msgLabelStyle}>
              {this.props.data.value}
            </Badge>
          </div>
        </OverlayTrigger>
      </div>
    );
  }
}

InOutSwitch.defaultProps = {
  onText: 'Open',
  offText: 'Close',
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: { value: 'undefined', state: 'IN', msg: 'UNKNOWN' },
};
