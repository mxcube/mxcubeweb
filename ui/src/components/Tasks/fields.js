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
  let state = null;
  if (error) {
    state = 'error';
  } else if (warning) {
    state = 'warning';
  }
  return state;
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


export function FieldsHeader({ title }) {
  return <Row >
    <Col xs={12} style={{  marginTop: '0.5em', marginBottom: '0.5em' }}>
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

export function StaticField({ label, data }) {
  return <Form.Group as={Row} className='d-flex' style={{ textAlign: 'left' }}>
   <Form.Label column sm="2" >
     <b>
        {label}
        :
      </b>
    </Form.Label>
    <Form.Label className='form-label-StaticField' column sm="9">
      {data}
    </Form.Label>
    {/* <Col sm="10">
      <Form.Control
        plaintext readOnly
        defaultValue={data}
        style={{ textAlign: 'left', marginBottom: '0px' }}
      />
    </Col> */}
  </Form.Group>
}

function ReduxInputField(prop) {
  return <Form.Group
    as={Row}
    controlId={prop.input.name}
    validationState={validation(prop.meta.error, prop.meta.warning)}
  >
    <Form.Label column xs={prop.col1 || 7} style={{ textAlign: 'left' }}>
      {prop.label}
    </Form.Label>
    <Col xs={prop.col2 || 4}>
      <Form.Control
        disabled={prop.disabled}
        value={prop.input.value}
        onChange={prop.input.onChange}
        {...prop}
      />
    </Col>
    {prop.meta.error || prop.meta.warning
      ? (
        <span style={{ top: '7px', left: '-10px', position: 'relative' }}>
          {errorIndicator(prop.meta.error, prop.meta.warning)}
        </span>
      ) : null
        }

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
    <Form.Label column xs="8" style={{ textAlign: 'left' }}>
      <b>
        {' '}
        {label}
        {' '}
      </b>
    </Form.Label>
    <Col className="mb-2" xs="4">
      <Form.Control value={value} readOnly />
    </Col>
  </Form.Group>
}

export function CheckboxField({ propName, label, disabled }) {
  return <Field
    name={propName}
    component={prop => (
      <Form.Group className='d-flex' controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null}>
        <Form.Label column xs={prop.col1 || 8} style={{ textAlign: 'left' }}>
          {label}
        </Form.Label>
        <Col className='mt-2 ms-1' xs={prop.col2 || 4}>
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
      <Form.Group className='d-flex mb-2' controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null}>
        <Form.Label column xs={col1 || 7} style={{ textAlign: 'left' }}>
          {label}
        </Form.Label>
        <Col xs={col2 || 4}>
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
      <Col key={i} xs={12 / children.length}>
        {child}
      </Col>
    )) : (
      <Col key={1} xs={6}>
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
          <Col xs={12}>
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
