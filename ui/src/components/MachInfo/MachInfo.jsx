import React from 'react';
import { OverlayTrigger, Popover, Badge, Row, Col } from 'react-bootstrap';

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

    const msgLabelStyle = { display: 'block', fontSize: '100%',
    borderRadius: '0px', color: '#000' };

    for (propname in this.props.info) {
      if (this.props.info.hasOwnProperty(propname)) {
        if (propname === 'attention') { continue; }
        propvalue = this.props.info[propname];
        msg = <Row className='mb-2'> <Col sm={3}>{propname}</Col> <Col sm={1}> : </Col> <Col sm={7}>{propvalue}</Col></Row>;
        popContent = <span>{popContent}{msg}</span>;
      }
    }

    popContent = <span>{popContent}</span>;

    const machinfoPop = (
       <Popover id="popover-machinfo">
         <Popover.Header>
          {tooltipTitle}
         </Popover.Header>
         <Popover.Body style={{ width: '400px' }}>
          {popContent}
         </Popover.Body>
       </Popover>
    );

    return (
      <OverlayTrigger placement="bottom" overlay={machinfoPop}>
        <div>
          <Badge bg='secondary' style={{ display: 'block', marginBottom: '3px' }}>
            Ring Current
          </Badge>
          <Badge bg={variant} style={msgLabelStyle}>{this.props.info.current}</Badge>
        </div>
      </OverlayTrigger>
    );
  }
}

MachInfo.defaultProps = {
  info: { current: -1, message: '' }
};
