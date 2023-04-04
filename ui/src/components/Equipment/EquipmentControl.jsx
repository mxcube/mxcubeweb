import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import Collapsible from 'react-collapsible';
import { BsChevronUp, BsChevronDown } from "react-icons/bs";
import EquipmentState from './EquipmentState';
import Form from '@rjsf/core';
import './GenericEquipmentControl.css';

export default class GenericEquipmentControl extends React.Component {
    handleRunCommand(cmd, formData) {
    this.props.executeCommand(this.props.equipment.name, cmd, formData)
  }

  renderParameters(key) {
    const a = this.props.equipment.commands;
    const attr = a[key];

    if (attr.signature.length > 1) {
      const schema = JSON.parse(attr.schema);

      return (
        <div>
          <h3>Arguments:</h3>
          <Form
            onSubmit={(formData, e) => this.handleRunCommand(key, formData.formData, e)}
            disabled={this.props.equipment.state !== 'READY'}
            schema={schema}
          >
            <Button className='mt-3' variant='outline-secondary' type="submit"><b>Run {key}</b></Button>
          </Form>
        </div>
      );
    } 
        return (
          <span>
            <p>(No arguments)</p>
            <Button className='mt-3' variant='outline-secondary' type="submit" onClick={(e) => this.handleRunCommand(key, {}, e)}>
              <b>Run {key}</b>
            </Button>
           </span>
        );
    
  }

  renderInfo(key) {
    const a = this.props.equipment.commands;
    const attr = a[key];

    if (attr.signature.length > 1) {
      const schema = JSON.parse(attr.schema);
      delete schema.definitions;
      delete schema.type;
      delete schema.title

      return (
        <div>
          <h3>Signature</h3>
          <pre>
            {JSON.stringify(schema,null,'\t')}
          </pre>
        </div>
      );
    } 
        return (<p/>);
    
  }

  getCollapsibleHeaderOpen(cssClass) {
    return (
      <BsChevronUp className={cssClass} size="1em"/>
    )
  }

  getCollapsibleHeaderClose(cssClass) {
    return (
      <BsChevronDown className={cssClass} size="1em"/>
    )
  }
  
  getEquipmentState() {
    return (
      <EquipmentState
        state={this.props.equipment.state}
        equipmentName={this.props.equipment.name}
        style={{ margin: '0px 0px 0px 0px', width: 'inherit'}}
    />
    )
  }



  render() {
    const a = this.props.equipment.commands;

    return Object.entries(a).map(([key, value]) => {
      return (
        <div key={`${this.props.equipment.name}-${key}`} className='mb-3'>
          <Collapsible
            trigger={<div> <b>Command: {key}</b> {this.getCollapsibleHeaderClose('collapsible-arrow-c')}</div>}
            triggerWhenOpen={<div> <b>Command: {key}</b> {this.getCollapsibleHeaderOpen('collapsible-arrow-c')}</div>}
          >
          <Row className='generic-equipment-collapsible-child-content'>
            <Col className="col-xs-6"> 
              {this.renderParameters(key)}
            </Col>
            <Col className="col-xs-6">
              {this.renderInfo(key)}
            </Col>
          </Row>
        </Collapsible>
        </div>

      );
    })
  }
}
