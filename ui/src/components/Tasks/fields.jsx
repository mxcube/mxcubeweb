import './style.css';

import React from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { TiTimes, TiWarning } from 'react-icons/ti';
import { Field } from 'redux-form';

export function getLastUsedParameters(type, newParams) {
  const lastParameters = localStorage.getItem(`last${type}Parameters`);

  return lastParameters === null ? newParams : JSON.parse(lastParameters);
}

export function saveToLastUsedParameters(formName, parameters, exclude = []) {
  const params = { ...parameters };

  exclude.forEach((paramName) => {
    delete params[paramName];
  });

  localStorage.setItem(`last${formName}Parameters`, JSON.stringify(params));
}

export function clearAllLastUsedParameters() {
  const collectionNames = [
    'datacollection',
    'characterisation',
    'mesh',
    'helical',
  ];

  collectionNames.forEach((type) => {
    localStorage.removeItem(`last${type}Parameters`);
  });
}

export function resetLastUsedParameters(formObj) {
  const { type } = formObj.props.taskData;
  localStorage.removeItem(`last${type}Parameters`);
  formObj.props.reset();

  const fieldNames = Object.keys(
    formObj.props.defaultParameters[type.toLowerCase()].acq_parameters,
  );

  const ignore = new Set([
    'osc_start',
    'resolution',
    'energy',
    'transmission',
    'beam_size',
  ]);

  fieldNames.forEach((field) => {
    if (!ignore.has(field)) {
      formObj.props.autofill(
        field,
        formObj.props.defaultParameters[type.toLowerCase()].acq_parameters[
          field
        ],
      );
    }
  });
}

export function toFixed(state, hoName, parameterName = null) {
  //
  //  Use 'remembered' value if:
  //
  //  - we are dealing with a single sample
  //  - 'remember parameters between samples' option is enabled AND the field is not marked as read-only
  //
  const withTaskData =
    !Array.isArray(state.taskForm.sampleIds) ||
    (state.queue.rememberParametersBetweenSamples &&
      !state.beamline.hardwareObjects[hoName].readonly);

  const pname = parameterName !== null ? parameterName : hoName;

  const value = withTaskData
    ? state.taskForm.taskData.parameters[pname]
    : state.beamline.hardwareObjects[hoName].value;

  if (value === undefined) {
    throw new Error(`No default task parameter or value for ${hoName}`);
  }

  const ho = state.beamline.hardwareObjects[hoName];
  let precision = null;

  for (const group of Object.values(state.uiproperties)) {
    for (const component of group.components) {
      if (component.attribute === hoName) {
        precision = component.precision;
        break;
      }
    }
  }

  return Number(
    value
      ? Number.parseFloat(value).toFixed(precision)
      : ho.value.toFixed(precision),
  );
}

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
      <i title={error}>
        <TiTimes size="1.3em" color="red" />
      </i>
    );
  } else if (warning) {
    icon = (
      <i title={warning}>
        <TiWarning size="1.3em" color="orange" />
      </i>
    );
  }
  return icon;
}

function errorLabel(error, warning) {
  let label = null;
  if (error) {
    label = <Form.Label style={{ color: 'red' }}>{error}</Form.Label>;
  } else if (warning) {
    label = <Form.Label style={{ color: 'orange' }}>{warning}</Form.Label>;
  }
  return label;
}

export function FieldsHeader({ title }) {
  return (
    <Row>
      <Col sm={12} style={{ marginTop: '0.5em', marginBottom: '0.5em' }}>
        <hr style={{ marginBottom: '-12px' }} />
        <center>
          <div>
            <b
              style={{
                position: 'relative',
                padding: '0.5em',
                backgroundColor: 'white',
              }}
            >
              {title}
            </b>
          </div>
        </center>
      </Col>
    </Row>
  );
}

export function StaticField({ label, data, col1, col2 }) {
  return (
    <Form.Group as={Row} style={{ textAlign: 'left' }}>
      <Form.Label column sm={col1 || 2}>
        <b>{label}:</b>
      </Form.Label>
      <Form.Label className="form-label-StaticField" column sm={col2 || 9}>
        {data}
      </Form.Label>
    </Form.Group>
  );
}

function ReduxInputField(prop) {
  return (
    <Form.Group controlId={prop.input.name}>
      <Row>
        <Form.Label
          column
          sm={prop.col1 || 6}
          style={{
            textAlign: 'left',
            color: validation(prop.meta.error, prop.meta.warning),
          }}
        >
          {prop.label}
        </Form.Label>
        <Col sm={prop.col2 || 4}>
          <Form.Control
            disabled={prop.disabled}
            value={prop.input.value}
            onChange={prop.input.onChange}
            {...prop}
            style={{
              borderColor: validation(prop.meta.error, prop.meta.warning),
            }}
          />
        </Col>
        {prop.meta.error || prop.meta.warning ? (
          <Col
            sm={1}
            style={{ top: '7px', left: '-10px', position: 'relative' }}
          >
            {errorIndicator(prop.meta.error, prop.meta.warning)}
          </Col>
        ) : (
          <Col sm={1} />
        )}
      </Row>
      {prop.meta.error || prop.meta.warning ? (
        <Row>
          <Col sm={12}>{errorLabel(prop.meta.error, prop.meta.warning)}</Col>
        </Row>
      ) : null}
    </Form.Group>
  );
}

export function InputField(prop) {
  const { propName, ...otherProps } = prop;
  return <Field name={propName} component={ReduxInputField} {...otherProps} />;
}

export function DisplayField({ label, value }) {
  return (
    <Form.Group as={Row}>
      <Form.Label column sm="8" style={{ textAlign: 'left' }}>
        <b> {label} </b>
      </Form.Label>
      <Col className="mb-2" sm="4">
        <Form.Control value={value} readOnly />
      </Col>
    </Form.Group>
  );
}

export function CheckboxField({ propName, label, disabled }) {
  return (
    <Field
      name={propName}
      component={(prop) => (
        <Form.Group
          className="mb-2"
          as={Row}
          controlId={prop.input.name}
          validationState={prop.meta.error ? 'error' : null}
        >
          <Form.Label column sm={prop.col1 || 8} style={{ textAlign: 'left' }}>
            {label}
          </Form.Label>
          <Col className="mt-2" sm={prop.col2 || 2}>
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
  );
}

export function SelectField({ propName, label, list, col1, col2 }) {
  return (
    <Field
      name={propName}
      component={(prop) => (
        <Form.Group
          as={Row}
          controlId={prop.input.name}
          validationState={prop.meta.error ? 'error' : null}
        >
          <Form.Label column sm={col1 || 6} style={{ textAlign: 'left' }}>
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
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <option key={i} value={v}>
                    {lbl}
                  </option>
                );
              })}
            </Form.Select>
          </Col>
        </Form.Group>
      )}
    />
  );
}

export function FieldsRow({ children }) {
  return (
    <Row className="mb-3">
      {children.length > 0 ? (
        children.map((child, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Col key={i} sm={12 / children.length}>
            {child}
          </Col>
        ))
      ) : (
        <Col key={1} sm={6}>
          {children}
        </Col>
      )}
    </Row>
  );
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
              {this.state.collapsed ? (
                <Button
                  variant="link"
                  onClick={() => {
                    this.setState({ collapsed: false });
                  }}
                >
                  Show more
                </Button>
              ) : (
                <Button
                  variant="link"
                  onClick={() => {
                    this.setState({ collapsed: true });
                  }}
                >
                  Hide
                </Button>
              )}
            </center>
          </Col>
        </Row>
        {this.state.collapsed ? '' : this.props.children}
      </div>
    );
  }
}
