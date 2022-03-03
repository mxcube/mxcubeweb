import React from 'react';
import { Panel } from 'react-bootstrap';

import './SampleChanger.css';
import '../context-menu-style.css';
 

export default class SampleChangerState extends React.Component {
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

    const title = `Sample changer (${this.props.state})`;

    return (
      <Panel style={{ marginTop: '0.5em' }} bsStyle={titleBackground}>
        <Panel.Heading>{title}</Panel.Heading>
      </Panel>
    );
  }
}
