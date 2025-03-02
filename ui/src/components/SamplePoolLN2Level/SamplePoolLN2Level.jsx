import React from 'react';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';


export default class SamplePoolLN2Level extends React.Component {
  constructor(props) {
    super(props);

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




  render() {
    const {showOvelay} = this.state;
    let msgBgStyle = 'warning';

    if (this.props.data !== 'UNKNOWN') {
      msgBgStyle = 'info';
    } else {
      msgBgStyle = 'warning';
    }



    const msgLabelStyle = { display: 'block', fontSize: '100%',
      borderRadius: '0px', color: '#000' };

    return (
      <div>
            <Badge
              bg="secondary"
              style={{ display: 'block', marginBottom: '3px' }}
            >
              {this.props.labelText}
            </Badge>
            <Badge bg={msgBgStyle} style={msgLabelStyle}>{this.props.data}</Badge>

      </div>
    );
  }
}


SamplePoolLN2Level.defaultProps = {

  labelText: '',
  pkey: undefined,
  // onSave: undefined,
  data: 'UNKNOWN',
};
