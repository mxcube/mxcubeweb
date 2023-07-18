import React from 'react';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import './style.css';

export default class SampleChangerSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.powerOn = this.powerOn.bind(this);
    this.powerOff = this.powerOff.bind(this);
    this.onRightLinkClick = this.onRightLinkClick.bind(this);
    this.showOvelay = this.showOvelay.bind(this);

    this.state = {
      showOvelay: false,
    };
  }

  showOvelay(value) {
    this.setState({
      showOvelay: value,
    });
  }

  onRightLinkClick(e) {
    // this.overlay.handleToggle();
    this.showOvelay(!this.state.showOvelay);
    e.preventDefault();
  }

  powerOn() {
    this.props.onSave('powerOn');

    // this.overlay.hide();
    this.showOvelay(false);
  }

  powerOff() {
    this.props.onSave('powerOff');
    // this.overlay.hide();
    this.showOvelay(false);
  }

  render() {
    const { showOvelay } = this.state;
    let msgBgStyle = 'warning';

    if (this.props.data === 'READY') {
      msgBgStyle = 'info';
    } else if (this.props.data === 'DISABLED') {
      msgBgStyle = 'warning';
    }

    let btn = (
      <Button variant="outline-secondary" size="sm" disabled>
        ---
      </Button>
    );
    if (this.props.data === 'DISABLED') {
      btn = (
        <Button variant="outline-secondary" size="sm" onClick={this.powerOn}>
          {this.props.offText}
        </Button>
      );
    } else if (this.props.data === 'READY') {
      btn = (
        <Button variant="outline-secondary" size="sm" onClick={this.powerOff}>
          {this.props.onText}
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
      <div className="samplechanger-switch">
        <OverlayTrigger
          // ref={(ref) => { this.overlay = ref; }}
          show={showOvelay}
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
            onClick={() => this.showOvelay(!showOvelay)}
            onContextMenu={this.onRightLinkClick}
          >
            <Badge
              bg="secondary"
              style={{ display: 'block', marginBottom: '3px' }}
            >
              {this.props.labelText}
            </Badge>
            <Badge bg={msgBgStyle} style={msgLabelStyle}>
              {this.props.data}
            </Badge>
          </div>
        </OverlayTrigger>
      </div>
    );
  }
}

SampleChangerSwitch.defaultProps = {
  onText: 'PowerOff',
  offText: 'PowerOn',
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: 'UNKNOWN',
};
