import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { Button, Col, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import Collapsible from 'react-collapsible';
import { BsChevronDown } from 'react-icons/bs';

import EquipmentState from './EquipmentState';
import styles from './GenericEquipmentControl.module.css';

export default function GenericEquipmentControl(props) {
  const { equipment, executeCommand } = props;

  function handleRunCommand(cmd, formData) {
    executeCommand(equipment.type.toLowerCase(), equipment.name, cmd, formData);
  }

  function renderParameters(key) {
    const attr = equipment.commands[key];

    if (attr.signature.length > 0) {
      const schema = JSON.parse(attr.schema);

      return (
        <div>
          <Form
            validator={validator}
            onSubmit={(formData) => handleRunCommand(key, formData.formData)}
            disabled={equipment.state !== 'READY'}
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
          onClick={() => handleRunCommand(key, {})}
        >
          <b>Run {key}</b>
        </Button>
      </span>
    );
  }

  function renderCommands() {
    return Object.entries(equipment.commands).map(([key, cmdObj]) => {
      if (!cmdObj.display) {
        return null;
      }

      return (
        <span key={key}>
          <OverlayTrigger
            trigger={['click']}
            placement="right"
            overlay={
              <Popover className={styles.cmdPopover}>
                <Popover.Header as="h3">
                  <b>{key}</b>
                </Popover.Header>
                <Popover.Body>
                  <Row className={styles.cmdPopoverBody}>
                    <Col className="col-xs-4">{renderParameters(key)}</Col>
                    <Col className="col-xs-8">
                      <div>
                        <h3>Last result</h3>
                        <pre>{equipment.msg}</pre>
                      </div>
                    </Col>
                  </Row>
                </Popover.Body>
              </Popover>
            }
            rootClose
          >
            <Button className="mt-3" variant="outline-secondary" type="submit">
              <b>{key}</b>
            </Button>
          </OverlayTrigger>
        </span>
      );
    });
  }

  return (
    <Row className="mb-3">
      <Col sm={12} className={styles.container}>
        <Collapsible
          triggerClassName={styles.trigger}
          triggerOpenedClassName={styles.trigger}
          trigger={
            <>
              <EquipmentState
                state={equipment.state}
                equipmentName={equipment.name}
              />
              <BsChevronDown className={styles.chevron} size="1em" />
            </>
          }
        >
          <div className={styles.content}>{renderCommands()}</div>
        </Collapsible>
      </Col>
    </Row>
  );
}
