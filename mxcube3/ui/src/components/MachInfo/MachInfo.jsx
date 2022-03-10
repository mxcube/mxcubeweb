import React from 'react';
import { OverlayTrigger, Popover, Button, Badge, Form } from 'react-bootstrap';

import './style.css';


export default class MachInfo extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.info !== this.props.info;
  }

  render() {
    const tooltipTitle = 'Machine Status\n';

    let variant = 'info';
    let msg = '';
    let propname = '';
    let propvalue = '';
    let popContent = '';

    if (this.props.info.attention === true) {
      variant = 'danger';
    } else {
      variant = 'info';
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
       <Popover style={{ minWidth: '2em', padding: '0.5em' }} id="popover-machinfo" title={tooltipTitle}>
          {popContent}
       </Popover>
    );

    return (
      <OverlayTrigger placement="bottom" overlay={machinfoPop}>
        <Button variant="outline-dark">
          Ring Current :
          {' '}
          <Badge bg={variant}>{this.props.info.current}</Badge>
        </Button>
      </OverlayTrigger>
    );
  }
}

MachInfo.defaultProps = {
  info: { current: -1, message: '' }
};
