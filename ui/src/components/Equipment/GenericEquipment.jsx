import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Collapsible from 'react-collapsible';
import { BsChevronUp, BsChevronDown } from 'react-icons/bs';
import EquipmentState from './EquipmentState';
import './GenericEquipmentControl.css';

export default class GenericEquipment extends React.Component {
  handleRunCommand(cmd, formData) {
    this.props.executeCommand(this.props.equipment.name, cmd, formData);
  }

  getCollapsibleHeaderOpen(cssClass) {
    return <BsChevronUp className={cssClass} size="1em" />;
  }

  getCollapsibleHeaderClose(cssClass) {
    return <BsChevronDown className={cssClass} size="1em" />;
  }

  getEquipmentState() {
    return (
      <EquipmentState
        state={this.props.state}
        equipmentName={this.props.name}
        style={{
          margin: '0px 0px 0px 0px',
          width: 'inherit',
          borderBottomLeftRadius: '0%',
          borderBottomRightRadius: '0%',
        }}
      />
    );
  }

  render() {
    return (
      <Row className="mb-3">
        <Col sm={12} className="generic-equipment-container">
          <Collapsible
            open={this.props.CollapseOpen}
            trigger={
              <div>
                {' '}
                {this.getEquipmentState()}{' '}
                {this.getCollapsibleHeaderClose('generic-equipment-arrow-p')}
              </div>
            }
            triggerWhenOpen={
              <div>
                {' '}
                {this.getEquipmentState()}{' '}
                {this.getCollapsibleHeaderOpen('generic-equipment-arrow-p')}
              </div>
            }
          >
            <div className="generic-equipment-container-collapsible">
              {this.props.children}
            </div>
          </Collapsible>
        </Col>
      </Row>
    );
  }
}
