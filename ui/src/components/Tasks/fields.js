import React from 'react';
import { Field } from 'redux-form';
import {
  Row,
  Col,
  Form,
  Button
} from 'react-bootstrap';
import { TiWarning, TiTimes } from "react-icons/ti";

import './style.css';

function validation(error, warning) {
  let stateColor = null;
  if (error) {
    stateColor = 'red';
  } else if (warning) {
    stateColor = 'orange';
  }
  return stateColor;
}

function errorIndicator(error, warning) {
  let icon = null;
  if (error) {
    icon = (
      <i title={error}><TiTimes size='1.3em' color='red'/></i>
    );
  } else if (warning) {
    icon = (
      <i title={warning}><TiWarning size='1.3em' color='orange'/></i>
    );
  }
  return icon;
}

function errorLabel(error, warning) {
  let label = null;
  if (error) {
    label = (
      <Form.Label style={{ color: 'red' }}>{error}</Form.Label>
    );
  } else if (warning) {
    label = (
      <Form.Label style={{ color: 'orange' }}>{warning}</Form.Label>
    );
  }
  return label;
}


export function FieldsHeader({ title }) {
  return <Row >
    <Col sm={12} style={{  marginTop: '0.5em', marginBottom: '0.5em' }}>
      <hr style={{ marginBottom: '-12px',  }} />
      <center>
        <div>
          <b style={{ position: 'relative', padding: '0.5em', backgroundColor: 'white' }}>
           {title} 
          </b>
        </div>
      </center>
    </Col>
  </Row>
}

export function StaticField({ label, data, col1, col2 }) {
  return <Form.Group as={Row} style={{ textAlign: 'left' }}>
   <Form.Label column sm={col1 || 2} >
     <b>
        {label}
        :
      </b>
    </Form.Label>
    <Form.Label className='form-label-StaticField' column sm={col2 || 9}>
      {data}
    </Form.Label>
  </Form.Group>
}

function ReduxInputField(prop) {
  return <Form.Group
    as={Row}
    controlId={prop.input.name}
  >
    <Row>
      <Form.Label
      column sm={6}
      style={{ textAlign: 'left', color: validation(prop.meta.error, prop.meta.warning) }}
      >
        {prop.label}
      </Form.Label>
      <Col sm={4}>
        <Form.Control
          disabled={prop.disabled}
          value={prop.input.value}
          onChange={prop.input.onChange}
          {...prop}
          style={{ borderColor: validation(prop.meta.error, prop.meta.warning) }}
        />
      </Col>
      {prop.meta.error || prop.meta.warning
        ? (
          <Col sm={1} style={{ top: '7px', left: '-10px', position: 'relative' }}>
            {errorIndicator(prop.meta.error, prop.meta.warning)}
          </Col>
        ) : <Col sm={1}/>
      }
    </Row>
    <Row>
      {prop.meta.error || prop.meta.warning
        ? (
          <Col >
            <div>
              {errorLabel(prop.meta.error, prop.meta.warning)}
            </div>
          </Col>
        ) : <Col/>
      }
    </Row>
  </Form.Group>
}

export function InputField(prop) {
  return <Field
    name={prop.propName}
    component={ReduxInputField}
    {...prop}
  />
}

export function DisplayField({ label, value }) {
  return <Form.Group as={Row}>
    <Form.Label column sm="8" style={{ textAlign: 'left' }}>
      <b>
        {' '}
        {label}
        {' '}
      </b>
    </Form.Label>
    <Col className="mb-2" sm="4">
      <Form.Control value={value} readOnly />
    </Col>
  </Form.Group>
}

export function CheckboxField({ propName, label, disabled }) {
  return <Field
    name={propName}
    component={prop => (
      <Form.Group className="mb-2" as={Row} controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null}>
        <Form.Label column sm={prop.col1 || 8} style={{ textAlign: 'left' }}>
          {label}
        </Form.Label>
        <Col className='mt-2' sm={prop.col2 || 2}>
          <Form.Check
            type="checkbox"
            defaultChecked={prop.input.value}
            value={prop.input.value}
            disabled={disabled}
            onChange={prop.input.onChange}
            {...prop}
          />
        </Col>
      </Form.Group>
    )}
  />
}

export function SelectField({
  propName, label, list, col1, col2
}) {
  return <Field
    name={propName}
    component={prop => (
      <Form.Group as={Row} controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null}>
        <Form.Label column sm={col1 || 6} style={{ textAlign: 'left'}}>
          {label}
        </Form.Label>
        <Col sm={col2 || 4}>
          <Form.Select
            value={prop.input.value}
            onChange={prop.input.onChange}
            {...prop}
          >
            {list.map((val, i) => {
              const lbl = Array.isArray(val) ? val[0] : val;
              const v = Array.isArray(val) ? val[1] : val;
              return (<option key={i} value={v}>{lbl}</option>);
            })}
          </Form.Select>
        </Col>
      </Form.Group>
    )}
  />
}

export function FieldsRow({ children }) {
  return <Row className='mb-3'>
    {children.length > 0 ? children.map((child, i) => (
      <Col key={i} sm={12 / children.length}>
        {child}
      </Col>
    )) : (
      <Col key={1} sm={6}>
        {children}
      </Col>
    )
     }
  </Row>
}

 
export class CollapsableRows extends React.Component {
  constructor(props) {
    super(props);

    this.state = { collapsed: true };
  }

  render() {
    return (
      <div>
        <Row>
          <Col sm={12}>
            <center>
              { this.state.collapsed
                ? (
                  <Button
                    variant="link"
                    onClick={() => { this.setState({ collapsed: false }); }}
                  >
                    <a>
                      Show more
                    </a>
                  </Button>
                )
                : (
                  <Button
                    variant="link"
                    onClick={() => { this.setState({ collapsed: true }); }}
                  >
                    <a>
                  Hide
                    </a>
                  </Button>
                )
            }
            </center>
          </Col>
        </Row>
        { this.state.collapsed ? '' : this.props.children }
      </div>
    );
  }
}
/* eslint-enable react/no-set-state */
