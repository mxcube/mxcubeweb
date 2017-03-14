import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import './style.css';


export default class MachInfo extends React.Component {
  constructor(props) {
    super(props);
    this.currentLabel = 'Current:';
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.info !== this.props.info;
  }

  render() {
    const tooltipTitle = 'Machine Status\n';

    let msgBgStyle = 'machine-msg-normal';
    let msg = '';
    let propname = '';
    let propvalue = '';
    let popContent = '';

    if (this.props.info.attention === true) {
      msgBgStyle = 'machine-msg-attention';
    } else {
      msgBgStyle = 'machine-msg-normal';
    }

    for (propname in this.props.info) {
      if (this.props.info.hasOwnProperty(propname)) {
        if (propname === 'attention') { continue; }
        propvalue = this.props.info[propname];
        msg = <p>{propname} : {propvalue}</p>;
        popContent = <span>{popContent}{msg}</span>;
      }
    }

    popContent = <span>{popContent}</span>;

    const machinfoPop = (
       <Popover id="popover-machinfo" title={tooltipTitle}>
          {popContent}
       </Popover>
    );

    return (
      <div>
        <OverlayTrigger placement="bottom" overlay={machinfoPop}>
        <div className="current-label">
          {this.currentLabel}
          <span className="current-value">
             {this.props.info.current} </span>
          <div className={`${msgBgStyle}`}>
             {this.props.info.message}
          </div>
        </div>
        </OverlayTrigger>
      </div>
    );
  }
}

MachInfo.defaultProps = {
  info: { current: -1, message: '' }
};
