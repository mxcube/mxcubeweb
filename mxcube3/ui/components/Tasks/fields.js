import React from 'react';
import { Field } from 'redux-form';
import { Row,
         Col,
         FormGroup,
         Checkbox,
         FormControl,
         ControlLabel,
         Button } from 'react-bootstrap';

export const FieldsHeader = ({ title }) => (
  <Row>
    <Col xs={12}>
      <center><b style={{ padding: '0.5em', backgroundColor: 'white' }}>{title}</b></center>
      <hr style={{ marginTop: '-10px' }}></hr>
    </Col>
  </Row>
);

export const StaticField = ({ label, data }) => (
    <FormGroup style={{ textAlign: 'left', marginBottom: '0px' }}>
      <Col xs={12}>
        <FormControl.Static
          style={{ padding: '5px 0px', minHeight: '0px' }}
        >
          <b>{label}:</b>{' '}{data}
        </FormControl.Static>
      </Col>
    </FormGroup>
);

const ReduxInputField = (prop) => (
       <FormGroup controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null}>
         <Col xs={prop.col1 || 8} componentClass={ControlLabel} style={{ textAlign: 'left' }}>
           {prop.label}
         </Col>
         <Col xs={prop.col2 || 4}>
           <FormControl value={prop.input.value} onChange={prop.input.onChange} {...prop} />
         </Col>
       </FormGroup>
);

export const InputField = (prop) => (
   <Field name={prop.propName}
     component={ReduxInputField}
     {...prop}
   />
);

export const DisplayField = ({ label, value }) => (
      <FormGroup>
        <Col className="col-xs-8 control-label" style={{ textAlign: 'left' }}>
           <b> {label} </b>
        </Col>
        <Col className="col-xs-4">
          <FormControl value={value} readOnly />
        </Col>
      </FormGroup>
);

export const CheckboxField = ({ propName, label, defaultChecked = false }) => (
   <Field name={propName}
     component={ (prop) =>
       <FormGroup controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null }>
         <Col xs={prop.col1 || 8} componentClass={ControlLabel} style={{ textAlign: 'left' }}>
           {label}
         </Col>
         <Col xs={prop.col2 || 4}>
            <Checkbox
              defaultChecked={defaultChecked}
              value={prop.input.value}
              onChange={prop.input.onChange}
              {...prop}
            />
         </Col>
       </FormGroup>
     }
   />
);

export const SelectField = ({ propName, label, list, col1, col2 }) => (
   <Field name={propName}
     component={ (prop) =>
       <FormGroup controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null }>
         <Col xs={col1 || 8} componentClass={ControlLabel} style={{ textAlign: 'left' }}>
           {label}
         </Col>
         <Col xs={col2 || 4}>
           <FormControl componentClass="select" value={prop.input.value}
             onChange={prop.input.onChange} {...prop}
           >
             {list.map((val, i) => {
               const lbl = Array.isArray(val) ? val[0] : val;
               const v = Array.isArray(val) ? val[1] : val;
               return (<option key={i} value={v}>{lbl}</option>);
             })}
           </FormControl>
         </Col>
       </FormGroup>
     }
   />
);

export const FieldsRow = ({ children }) => (
   <Row>
     {children.length > 0 ? children.map((child, i) =>
       <Col key={i} xs={12 / children.length}>
         {child}
       </Col>
     ) : <Col key={ 1 } xs={ 6 } >
          {children}
         </Col>
     }
   </Row>
);

/* eslint-disable react/no-set-state */
export class CollapsableRows extends React.Component {
  constructor(props) {
    super(props);

    this.state = { collapsed: true };
  }

  render() {
    return (<div>
      { this.state.collapsed ? '' : this.props.children }
      <Row>
        <Col xs={12}>
          <center>
            { this.state.collapsed ?
              <Button bsStyle="link"
                onClick={() => {this.setState({ collapsed: false });}}
              >
                <a>
                  <i className="glyphicon glyphicon-option-horizontal" aria-hidden="true"></i>
                </a>
              </Button> :
              <Button bsStyle="link"
                onClick={() => {this.setState({ collapsed: true });}}
              >
                <a>
                  <i className="glyphicon glyphicon-option-vertical" aria-hidden="true"></i>
                </a>
              </Button>
            }
          </center>
        </Col>
      </Row>
    </div>);
  }
}
/* eslint-enable react/no-set-state */
