import React from 'react';
import { Field } from 'redux-form';
import { Row,
         Col,
         FormGroup, 
         Checkbox,
         FormControl,
         ControlLabel,
         Label, 
         Button } from 'react-bootstrap';

export const FieldsHeader = ({ title }) => (
  <Row>
    <Col xs={12}>
      <center><h4><Label>{title}</Label></h4></center>
    </Col>
  </Row>
);

export const StaticField = ({ label, data, input, meta }) => (
  <Row>
    <Col xs={2} componentClass={ControlLabel}>{label}</Col>
    <Col xs={10}>
      <FormControl.Static>{data}</FormControl.Static>
    </Col>
  </Row>
);

export const InputField = ({propName, label, input, meta}) => (
   <Field name={propName}
              component={ (prop) => <FormGroup controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null }>
                  <Col xs={4} componentClass={ControlLabel}>{label}</Col>
                  <Col xs={8}>
                    <FormControl value={prop.input.value} onChange={prop.input.onChange} {...prop} />
                  </Col>
                </FormGroup>
              }
   />
);

export const CheckboxField = ({propName, label, input, meta}) => (
   <Field name={propName}
              component={ (prop) =>
                <FormGroup controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null }>
                  <Col xs={12}>
                    <Checkbox inline value={prop.input.value} onChange={prop.input.onChange} {...prop}>{label}</Checkbox>
                  </Col>
                </FormGroup>
              }
   />
);

export const SelectField = ({propName, label, list, input, meta}) => (
   <Field name={propName}
              component={ (prop) =>
                <FormGroup controlId={prop.input.name} validationState={prop.meta.error ? 'error' : null }>
                  <Col xs={4} componentClass={ControlLabel}>{label}</Col>
                  <Col xs={8}>
                    <FormControl componentClass="select" value={prop.input.value} onChange={prop.input.onChange} {...prop}>
                      {list.map((val, i) => <option key={i} value={val}>{val}</option>)}
                    </FormControl>
                  </Col>
                </FormGroup>
              }
   />
);

export const FieldsRow = ({ children }) => (
   <Row>
     {children.length > 0 ? children.map((child, i) => 
       <Col key={i} xs={12/children.length}>
         {child}
       </Col>
     ) : null }
   </Row>
);


export class CollapsableRows extends React.Component {
  constructor(props) {
    super(props);
   
    this.state = { collapsed: true }
  }

  render() {
    return (<div>
      { this.state.collapsed ? "" : this.props.children }
      <Row>
        <Col xs={12}>
          { this.state.collapsed ?
            <Button bsStyle="link" className="pull-right" onClick={()=>{this.setState({ collapsed: false })}}>Show more</Button>
          : <Button bsStyle="link" className="pull-right" onClick={()=>{this.setState({ collapsed: true })}}>Show less</Button> }
        </Col>
      </Row>
    </div>);
  }
}

