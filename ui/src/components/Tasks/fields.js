import React from 'react';
import { Field } from 'redux-form';
import {
  Row,
  Col,
  FormGroup,
  Checkbox,
  FormControl,
  ControlLabel,
  Button,
} from 'react-bootstrap';

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
      <span
        className="glyphicon glyphicon-remove"
        title={error}
        style={{ color: 'red' }}
      />
    );
  } else if (warning) {
    icon = (
      <span
        className="glyphicon glyphicon-exclamation-sign"
        title={warning}
        style={{ color: 'orange' }}
      />
    );
  }
  return icon;
}

export function FieldsHeader({ title }) {
  return <Row>
    <Col xs={12}>
      <center>
        <b style={{ padding: '0.5em', backgroundColor: 'white' }}>{title}</b>
      </center>
      <hr style={{ marginTop: '-10px' }} />
    </Col>
  </Row>
}

export function StaticField({ label, data }) {
  return <FormGroup style={{ textAlign: 'left', marginBottom: '0px' }}>
    <Col xs={12}>
      <FormControl.Static style={{ padding: '5px 0px', minHeight: '0px' }}>
        <b>{label}:</b> {data}
      </FormControl.Static>
    </Col>
  </FormGroup>
}

function ReduxInputField(prop) {
  return <FormGroup
    controlId={prop.input.name}
    validationState={validation(prop.meta.error, prop.meta.warning)}
  >
    <Col
      xs={prop.col1 || 7}
      componentClass={ControlLabel}
      style={{ textAlign: 'left' }}
    >
      {prop.label}
    </Col>
    <Col xs={prop.col2 || 4}>
      <FormControl
        disabled={prop.disabled}
        value={prop.input.value}
        onChange={prop.input.onChange}
        {...prop}
      />
    </Col>
    {prop.meta.error || prop.meta.warning ? (
      <span style={{ top: '7px', left: '-10px', position: 'relative' }}>
        {errorIndicator(prop.meta.error, prop.meta.warning)}
      </span>
    ) : null}
  </FormGroup>
}

export function InputField(prop) {
  return <Field name={prop.propName} component={ReduxInputField} {...prop} />
}

export function DisplayField({ label, value }) {
  return <FormGroup>
    <Col className="col-xs-8 control-label" style={{ textAlign: 'left' }}>
      <b> {label} </b>
    </Col>
    <Col className="col-xs-4">
      <FormControl value={value} readOnly />
    </Col>
  </FormGroup>
}

export function CheckboxField({ propName, label, disabled }) {
  return <Field
    name={propName}
    component={(prop) => (
      <FormGroup
        controlId={prop.input.name}
        validationState={prop.meta.error ? 'error' : null}
      >
        <Col
          xs={prop.col1 || 8}
          componentClass={ControlLabel}
          style={{ textAlign: 'left' }}
        >
          {label}
        </Col>
        <Col xs={prop.col2 || 4}>
          <Checkbox
            defaultChecked={prop.input.value}
            value={prop.input.value}
            disabled={disabled}
            onChange={prop.input.onChange}
            {...prop}
          />
        </Col>
      </FormGroup>
    )}
  />
}

export function SelectField({ propName, label, list, col1, col2 }) {
  return <Field
    name={propName}
    component={(prop) => (
      <FormGroup
        controlId={prop.input.name}
        validationState={prop.meta.error ? 'error' : null}
      >
        <Col
          xs={col1 || 7}
          componentClass={ControlLabel}
          style={{ textAlign: 'left' }}
        >
          {label}
        </Col>
        <Col xs={col2 || 4}>
          <FormControl
            componentClass="select"
            value={prop.input.value}
            onChange={prop.input.onChange}
            {...prop}
          >
            {list.map((val, i) => {
              const lbl = Array.isArray(val) ? val[0] : val;
              const v = Array.isArray(val) ? val[1] : val;
              return (
                <option key={i} value={v}>
                  {lbl}
                </option>
              );
            })}
          </FormControl>
        </Col>
      </FormGroup>
    )}
  />
}

export function FieldsRow({ children }) {
  return <Row>
    {children.length > 0 ? (
      children.map((child, i) => (
        <Col key={i} xs={12 / children.length}>
          {child}
        </Col>
      ))
    ) : (
      <Col key={1} xs={6}>
        {children}
      </Col>
    )}
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
        {this.state.collapsed ? '' : this.props.children}
        <Row>
          <Col xs={12}>
            <center>
              {this.state.collapsed ? (
                <Button
                  bsStyle="link"
                  onClick={() => {
                    this.setState({ collapsed: false });
                  }}
                >
                  <a>Show</a>
                </Button>
              ) : (
                <Button
                  bsStyle="link"
                  onClick={() => {
                    this.setState({ collapsed: true });
                  }}
                >
                  <a>Hide</a>
                </Button>
              )}
            </center>
          </Col>
        </Row>
      </div>
    );
  }
}
/* eslint-enable react/no-set-state */
