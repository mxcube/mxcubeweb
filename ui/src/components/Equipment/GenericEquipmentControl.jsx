import React from 'react';
import { Row, Col, Accordion, Button } from 'react-bootstrap';
import EquipmentState from './EquipmentState';
import Form from '@rjsf/core';
import './GenericEquipmentControl.css';

export default class GenericEquipmentControl extends React.Component {
    handleRunCommand(cmd, formData) {
    this.props.executeCommand(this.props.equipment.name, cmd, formData)
  }

  renderParameters(key) {
    const a = this.props.equipment.attributes;
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
    const a = this.props.equipment.attributes;
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

  getCommands() {
    const a = this.props.equipment.attributes;

    return Object.entries(a).map(([key, value]) => {
      return (
       <Accordion defaultActiveKey="0" className="command-panel">
         <Accordion.Item>
           <Accordion.Header className='custom-accordion-header-child'><b>Command: {key}</b></Accordion.Header>
           <Accordion.Body className=''>
             <Row>
              <Col className="col-xs-6">
                {this.renderParameters(key)}
              </Col>
              <Col className="col-xs-6">
                {this.renderInfo(key)}
              </Col>
             </Row>
           </Accordion.Body>
          </Accordion.Item>
       </Accordion>
      );
    })
  }

  render() {
    return (
      <Row className='mb-2 generic-equipment-container'>
        <Col sm={12} className=''>
            <Accordion defaultActiveKey="0">
              <Accordion.Item>
                <Accordion.Header className='custom-accordion-header'>
                <EquipmentState
                  state={this.props.equipment.state}
                  equipmentName={this.props.equipment.name}
                  style={{ margin: '0px 10px 0px 0px', width: 'inherit'}}
                />
                </Accordion.Header>
                <Accordion.Body className="p-3 generic-equipment-container-panel-body">
                  {this.getCommands()}
                  {this.renderDialog}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
        </Col>
      </Row>
    );
  }
}
