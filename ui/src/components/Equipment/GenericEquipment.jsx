import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Collapsible from 'react-collapsible';
import { BsChevronUp, BsChevronDown } from 'react-icons/bs';
import EquipmentState from './EquipmentState';
import styles from './genericEquipmentControl.module.css';

export default function GenericEquipment(props) {
  function renderCollapsibleHeaderOpen(cssClass) {
    return <BsChevronUp className={cssClass} size="1em" />;
  }

  function renderCollapsibleHeaderClose(cssClass) {
    return <BsChevronDown className={cssClass} size="1em" />;
  }

  function renderEquipmentState() {
    return (
      <EquipmentState
        state={props.state}
        equipmentName={props.name}
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
          open={props.CollapseOpen}
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
            {props.children}
          </div>
        </Collapsible>
      </Col>
    </Row>
  );
}
