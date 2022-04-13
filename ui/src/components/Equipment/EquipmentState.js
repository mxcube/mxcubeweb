import React from 'react';
import { Alert } from 'react-bootstrap';

import '../context-menu-style.css';
/* eslint-disable react/no-multi-comp */

export default class EquipmentState extends React.Component {
  render() {
    let titleBackground;

    if (this.props.state === 'READY') {
      titleBackground = 'success';
    } else if (this.props.state === 'MOVING') {
      titleBackground = 'warning';
    } else if (this.props.state === 'LOADING') {
      titleBackground = 'warning';
    } else if (this.props.state === 'DISABLED') {
      titleBackground = 'danger';
    } else {
      titleBackground = 'danger';
    }

    return (
      <Alert style={{ marginTop: '0.5em' }} variant={titleBackground}>
        {this.props.equipmentName}
        {' '}
        {this.props.state}
      </Alert>
    );
  }
}
