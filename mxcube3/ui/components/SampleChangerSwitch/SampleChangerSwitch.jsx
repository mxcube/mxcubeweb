import React from 'react';
import { Label, Button, OverlayTrigger, Popover } from 'react-bootstrap';


export default class SampleChangerSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.powerOn = this.powerOn.bind(this);
    this.powerOff = this.powerOff.bind(this);
    this.onRightLinkClick = this.onRightLinkClick.bind(this);
  }


  onRightLinkClick(e) {
    this.refs.overlay.handleToggle();
    e.preventDefault();
  }


  powerOn() {
    this.props.onSave('powerOn');

    this.refs.overlay.hide();
  }


  powerOff() {
    this.props.onSave('powerOff');

    this.refs.overlay.hide();
  }


  render() {
    let msgBgStyle = 'warning';
    if (this.props.data === 'READY') {
      msgBgStyle = 'info';
    } else if (this.props.data === 'DISABLED') {
      msgBgStyle = 'warning';
    }

    let btn = <Button block bsSize="small" disabled>---</Button>;
    if (this.props.data === 'DISABLED') {
      btn = <Button block bsSize="small" onClick={this.powerOn}>{this.props.offText}</Button>;
    } else if (this.props.data === 'READY') {
      btn = <Button block bsSize="small" onClick={this.powerOff}>{this.props.onText}</Button>;
    }

    const msgLabelStyle = { display: 'block', fontSize: '100%',
                            borderRadius: '0px', color: '#000' };

    return (
      <div>
        <OverlayTrigger
          ref="overlay"
          rootClose
          trigger="click"
          placement="bottom"
          overlay={(<Popover id={`${this.props.labelText} popover`}>{btn}</Popover>)}
        >
          <div onContextMenu={this.onRightLinkClick}>
            <Label
              style={{ display: 'block', marginBottom: '3px' }}
            >
              {this.props.labelText}
            </Label>
            <Label bsStyle={msgBgStyle} style={msgLabelStyle}>{this.props.data}</Label>
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
  data: 'DISABLED',
};
