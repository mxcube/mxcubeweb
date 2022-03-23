import React from 'react';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';


export default class InOutSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.setOff = this.setOff.bind(this);
    this.setOn = this.setOn.bind(this);
    this.onLinkRightClick = this.onLinkRightClick.bind(this);
    this.onOptionsRightClick = this.onOptionsRightClick.bind(this);
  }


  onLinkRightClick(e) {
    this.overlay.handleToggle();
    e.preventDefault();
  }


  onOptionsRightClick(e) {
    this.optionsOverlay.handleToggle();
    e.preventDefault();
  }

  setOff() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, this.props.offText);
    }

    this.overlay.hide();
  }


  setOn() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, this.props.onText);
    }

    this.overlay.hide();
  }


  renderLabel() {
    let optionsLabel = (
      <Badge
        bg="secondary"
        style={{ display: 'block', marginBottom: '3px' }}
      >
        {this.props.labelText}
      </Badge>);

    if (this.props.optionsOverlay) {
      optionsLabel = (
         <OverlayTrigger
           ref={(ref) => { this.optionsOverlay = ref; }}
           rootClose
           trigger="click"
           placement="bottom"
           overlay={ this.props.optionsOverlay }
         >
           <div onContextMenu={this.onOptionsRightClick}>
             <Badge
              bg="secondary"
               style={{ display: 'block', marginBottom: '3px' }}
             >
               { this.props.labelText }
                 <i className="fas fa-cog ms-2" />
             </Badge>
           </div>
        </OverlayTrigger>);
    }

    return optionsLabel;
  }

  render() {
    let msgBgStyle = 'warning';
    if (this.props.data.value === this.props.onText) {
      msgBgStyle = 'success';
    } else if (this.props.data.value === this.props.offText) {
      msgBgStyle = 'danger';
    }

    let btn = <Button block size="sm" disabled>---</Button>;

    if (this.props.data.value === this.props.onText) {
      btn = <Button block size="small" onClick={this.setOff}>Set: {this.props.offText}</Button>;
    } else {
      btn = <Button block size="small" onClick={this.setOn}>Set: {this.props.onText}</Button>;
    }

    const msgLabelStyle = { display: 'block', fontSize: '100%',
      borderRadius: '0px', color: '#000' };

    return (
      <div>
       {this.renderLabel()}
        <OverlayTrigger
          ref={(ref) => { this.overlay = ref; }}
          rootClose
          trigger="click"
          placement="bottom"
          overlay={(<Popover style={{ padding: '0.5em'}} id={`${this.props.labelText} popover`}>{btn}</Popover>)}
        >
          <div onContextMenu={this.onLinkRightClick}>
            <Badge bg={msgBgStyle} style={msgLabelStyle}>{this.props.data.msg}</Badge>
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
  data: { value: 'undefined', state: 'IN', msg: 'UNKNOWN' }
};
