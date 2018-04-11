import React from 'react';
import { Label } from 'react-bootstrap';

import './style.css';


export default class LabeledValue extends React.Component {
  render() {
    let bsStyle = 'info';
    return (
      <div>
        <span>
          <div>
            <Label
              bsStyle="default"
              style={{ backgroundColor: 'transparent', display: 'block',
                       marginBottom: '3px', color: '#000' }}
            >
              {this.props.name}
            </Label>
          </div>
          <div>
            <Label
              bsStyle={bsStyle}
              style={{ backgroundColor: 'transparent', display: 'block-inline',
                       fontSize: '100%', borderRadius: '0px', color: '#000',
                       padding: '0px' }}
            >
              {this.props.value} {this.props.suffix}
            </Label>
          </div>
        </span>
      </div>
    );
  }
}

LabeledValue.defaultProps = {
  extraInfo: {},
  value: 0,
  name: '',
  suffix: ''
};
