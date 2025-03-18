import React from 'react';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';


export default class PlateModeSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.turnOnPlateMode = this.turnOnPlateMode.bind(this);
    this.turnOffPlateMode = this.turnOffPlateMode.bind(this);
    this.onRightLinkClick = this.onRightLinkClick.bind(this);
    this.showOvelay = this.showOvelay.bind(this);

    this.state = {
      showOvelay: false,
    };
  }

  showOvelay(value) {
    this.setState({
      showOvelay: value
    });
  }


  onRightLinkClick(e) {
    // this.overlay.handleToggle();
    this.showOvelay(!this.state.showOvelay)
    e.preventDefault();
  }


  turnOnPlateMode() {
    this.props.onSave('turnOnPlateMode');

    // this.overlay.hide();
    this.showOvelay(false)
  }


  turnOffPlateMode() {
    this.props.onSave('turnOffPlateMode');
    // this.overlay.hide();
    this.showOvelay(false)
  }


  render() {
    const {showOvelay} = this.state;
    let msgBgStyle = 'warning';

    if (this.props.data === 'True') {
      msgBgStyle = 'info';
    } else if (this.props.data !== 'True') {
      msgBgStyle = 'warning';
    }

    let btn = <Button variant='outline-secondary' size="sm" disabled>---</Button>;
    if (this.props.data === 'False') {
      btn = <Button variant='outline-secondary' size="sm" onClick={this.turnOnPlateMode}>{this.props.offText}</Button>;
    } else if (this.props.data === 'True') {
      btn = <Button variant='outline-secondary' size="sm" onClick={this.turnOffPlateMode}>{this.props.onText}</Button>;
    }

    const msgLabelStyle = { display: 'block', fontSize: '100%',
      borderRadius: '0px', color: '#000' };

    return (
      <div>
        <OverlayTrigger
          // ref={(ref) => { this.overlay = ref; }}
          show={showOvelay}
          rootClose
          trigger="click"
          placement="bottom"
          overlay={(<Popover style={{ padding: '0.5em' }} id={`${this.props.labelText} popover`}>{btn}</Popover>)}
        >
          <div onClick={() => this.showOvelay(!showOvelay)} onContextMenu={this.onRightLinkClick}>
            <Badge
              bg="secondary"
              style={{ display: 'block', marginBottom: '3px' }}
            >
              {this.props.labelText}
            </Badge>
            <Badge bg={msgBgStyle} style={msgLabelStyle}>{this.props.data}</Badge>
          </div>
        </OverlayTrigger>
      </div>
    );
  }
}


PlateModeSwitch.defaultProps = {
  onText: 'turn off',
  offText: 'turn on',
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: 'UNKNOWN',
};
