import React from 'react';
import { Panel, } from 'react-bootstrap';

import './SampleChanger.css';
import '../context-menu-style.css';
/* eslint-disable react/no-multi-comp */

export default class SampleChangerState extends React.Component {

  render() {
    let titleBackground;
    let title;

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

    title = `Sample changer (${this.props.state})`;

    return (
      <Panel style={{ marginTop: '0.5em' }} header={title} bsStyle={titleBackground} />
    );
  }
}

