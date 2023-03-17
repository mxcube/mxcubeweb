import React from 'react';
import { Row, Col, Accordion, Button, Card, OverlayTrigger, Popover } from 'react-bootstrap';

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

    if (attr.signature.length > 0) {
      const schema = JSON.parse(attr.schema);

      return (
        <div>
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
        <h3>(No arguments)</h3>
        <Button className='mt-3' variant='outline-secondary' type="submit" onClick={(e) => this.handleRunCommand(key, {}, e)}>
          <b>Run {key}</b>
        </Button>
      </span>
    );

  }

  renderInfo(key) {
    return (
      <div>
        <h3>Last result</h3>
        <pre>{this.props.equipment.msg}</pre>
      </div>
    );
  }

  getCollapsibleHeaderOpen(cssClass) {
    return (
      <BsChevronUp className={cssClass} size="1em" />
    )
  }

  getCollapsibleHeaderClose(cssClass) {
    return (
      <BsChevronDown className={cssClass} size="1em" />
    )
  }

  getCommands() {
    const a = this.props.equipment.commands;
    return Object.entries(a).map(([key, cmdObj]) => {
      let result = null;

      if (cmdObj.display) {

        const popover = (
          <Popover id="equipment-popover">
            <Popover.Header as="h3"><b>{key}</b></Popover.Header>
            <Popover.Body>
              <Row className='generic-equipment-collapsible-child-content'>
                <Col className="col-xs-4">
                  {this.renderParameters(key)}
                </Col>
                <Col className="col-xs-8">
                  {this.renderInfo(key)}
                </Col>
              </Row>
            </Popover.Body>
          </Popover>
        );

        result = (
          <span>
            <OverlayTrigger trigger={["click"]} placement="right" overlay={popover}>
              <Button className='mt-3' variant='outline-secondary' type="submit">
                <b>{key}</b>
              </Button>
            </OverlayTrigger>
          </span>
        );
      }

      return result;
    })
  }

  getEquipmentState() {
    return (
      <EquipmentState
        state={this.props.equipment.state}
        equipmentName={this.props.equipment.name}
        style={{ margin: '0px 0px 0px 0px', width: 'inherit' }}
      />
    )
  }



  render() {
    return (
      <Row className='mb-3'>
        <Col sm={12} className='generic-equipment-container'>
          <Collapsible
            className=''
            trigger={<div> {this.getEquipmentState()} {this.getCollapsibleHeaderClose('generic-equipment-arrow-p')}</div>}
            triggerWhenOpen={<div> {this.getEquipmentState()} {this.getCollapsibleHeaderOpen('generic-equipment-arrow-p')}</div>}
          >
            <div className='generic-equipment-container-collapsible'>
              {this.getCommands()}
            </div>
          </Collapsible>
        </Col>
      </Row>
    );
  }
}
