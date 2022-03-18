import React from 'react';
import { OverlayTrigger, Popover, Label } from 'react-bootstrap';

import './style.css';

export default class MachInfo extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.info !== this.props.info;
  }

  render() {
    const tooltipTitle = 'Machine Status\n';

    let bsStyle = 'info';
    let msg = '';
    let propname = '';
    let propvalue = '';
    let popContent = '';

    if (this.props.info.attention === true) {
      bsStyle = 'danger';
    } else {
      bsStyle = 'info';
    }

    for (propname in this.props.info) {
      if (this.props.info.hasOwnProperty(propname)) {
        if (propname === 'attention') {
          continue;
        }
        propvalue = this.props.info[propname];
        msg = (
          <p>
            {propname} : {propvalue}
          </p>
        );
        popContent = (
          <span>
            {popContent}
            {msg}
          </span>
        );
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
          <span>
            <div>
              <Label
                bsStyle="default"
                style={{ display: 'block', marginBottom: '3px' }}
              >
                Ring Current
              </Label>
            </div>
            <div>
              <Label
                bsStyle={bsStyle}
                style={{
                  display: 'block',
                  fontSize: '100%',
                  borderRadius: '0px',
                }}
              >
                {this.props.info.current}
              </Label>
            </div>
          </span>
        </OverlayTrigger>
      </div>
    );
  }
}

MachInfo.defaultProps = {
  info: { current: -1, message: '' },
};
