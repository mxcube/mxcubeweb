import React from 'react';
import { Row, Col, Button, OverlayTrigger, Popover } from 'react-bootstrap';

import Collapsible from 'react-collapsible';
import { BsChevronUp, BsChevronDown } from 'react-icons/bs';
import EquipmentState from './EquipmentState';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import styles from './genericEquipmentControl.module.css';

export default function GenericEquipmentControl(props) {
  function handleRunCommand(cmd, formData) {
    props.executeCommand(props.equipment.name, cmd, formData);
  }

  function renderParameters(key) {
    const a = props.equipment.commands;
    const attr = a[key];

    if (attr.signature.length > 0) {
      const schema = JSON.parse(attr.schema);

      return (
        <div>
          <Form
            validator={validator}
            onSubmit={(formData, e) => handleRunCommand(key, formData.formData)}
            disabled={props.equipment.state !== 'READY'}
            schema={schema}
          >
            <Button className="mt-3" variant="outline-secondary" type="submit">
              <b>Run {key}</b>
            </Button>
          </Form>
        </div>
      );
    }

    return (
      <span>
        <h3>(No arguments)</h3>
        <Button
          className="mt-3"
          variant="outline-secondary"
          type="submit"
          onClick={(e) => handleRunCommand(key, {})}
        >
          <b>Run {key}</b>
        </Button>
      </span>
    );
  }

  function renderInfo(key) {
    return (
      <div>
        <h3>Last result</h3>
        <pre>{props.equipment.msg}</pre>
      </div>
    );
  }

  function renderCollapsibleHeaderOpen(cssClass) {
    return <BsChevronUp className={cssClass} size="1em" />;
  }

  function renderCollapsibleHeaderClose(cssClass) {
    return <BsChevronDown className={cssClass} size="1em" />;
  }

  function renderCommands() {
    const a = props.equipment.commands;
    return Object.entries(a).map(([key, cmdObj]) => {
      let result = null;

      if (cmdObj.display) {
        const popover = (
          <Popover id="equipment-popover">
            <Popover.Header as="h3">
              <b>{key}</b>
            </Popover.Header>
            <Popover.Body>
              <Row
                className={styles.generic_equipment_collapsible_child_content}
              >
                <Col className="col-xs-4">{renderParameters(key)}</Col>
                <Col className="col-xs-8">{renderInfo(key)}</Col>
              </Row>
            </Popover.Body>
          </Popover>
        );

        result = (
          <span key={key}>
            <OverlayTrigger
              trigger={['click']}
              placement="right"
              overlay={popover}
              rootClose
            >
              <Button
                className="mt-3"
                variant="outline-secondary"
                type="submit"
              >
                <b>{key}</b>
              </Button>
            </OverlayTrigger>
          </span>
        );
      }

      return result;
    });
  }

  function renderEquipmentState() {
    return (
      <EquipmentState
        state={props.equipment.state}
        equipmentName={props.equipment.name}
        style={{
          margin: '0px 0px 0px 0px',
          width: 'inherit',
          borderBottomLeftRadius: '0%',
          borderBottomRightRadius: '0%',
        }}
      />
    );
  }

  return (
    <Row className="mb-3">
      <Col sm={12} className={styles.generic_equipment_container}>
        <Collapsible
          trigger={
            <div>
              {' '}
              {renderEquipmentState()}{' '}
              {renderCollapsibleHeaderClose(styles.generic_equipment_arrow_p)}
            </div>
          }
          triggerWhenOpen={
            <div>
              {' '}
              {renderEquipmentState()}{' '}
              {renderCollapsibleHeaderOpen(styles.generic_equipment_arrow_p)}
            </div>
          }
        >
          <div className={styles.generic_equipment_container_collapsible}>
            {renderCommands()}
          </div>
        </Collapsible>
      </Col>
    </Row>
  );
}
