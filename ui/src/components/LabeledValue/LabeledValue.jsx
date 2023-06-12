import React from 'react';
import { Button, Form } from 'react-bootstrap';

import './style.css';


export default class LabeledValue extends React.Component {
  render() {
    let labelStyle = {
      backgroundColor: 'transparent', display: 'block',
      marginBottom: 0, color: '#000'
    };
    let valueStyle = {
      backgroundColor: 'transparent', display: 'block-inline',
      fontSize: '100%', borderRadius: '0px', color: '#000',
      padding: '0px', marginBottom: 0, whiteSpace: 'nowrap'
    };

    if (this.props.look === 'vertical') {
      labelStyle = { display: 'block', marginBottom: '3px' };
      valueStyle = { display: 'block', fontSize: '100%', borderRadius: '0px' };
    }

    let value = this.props.value.toFixed(Number.parseInt(this.props.precision, 10));

    if (this.props.format === 'expo') {
      value = Number.parseFloat(this.props.value).toExponential(this.props.precision);
    }

    return (
      <div className="labled-value d-flex">
        {this.props.name && (<Form.Label style={labelStyle}>
          {this.props.name}
          <span style={{ marginRight: '0.5em' }} />
        </Form.Label>)}

        <Form.Label
          variant={this.props.level}
          style={valueStyle}
        >
          {value} {this.props.suffix}
        </Form.Label>
      </div>
    );
  }
}

LabeledValue.defaultProps = {
  extraInfo: {},
  value: 0,
  name: '',
  suffix: '',
  precision: '1',
  format: '',
  look: 'horizontal',
  level: 'info'
};
