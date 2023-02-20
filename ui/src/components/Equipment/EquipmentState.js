import React from 'react';
import { Alert } from 'react-bootstrap';
 
export default class EquipmentState extends React.Component {
  render() {
    let titleBackground;

    switch (this.props.state) {
    case 'READY': {
      titleBackground = 'success';
    
    break;
    }
    case 'MOVING': {
      titleBackground = 'warning';
    
    break;
    }
    case 'LOADING': {
      titleBackground = 'warning';
    
    break;
    }
    case 'DISABLED': {
      titleBackground = 'danger';
    
    break;
    }
    default: {
      titleBackground = 'danger';
    }
    }

    return (
      <Alert style={this.props.style} variant={titleBackground}>
        {this.props.equipmentName}
        {' '}
        {this.props.state}
      </Alert>
    );
  }
}
