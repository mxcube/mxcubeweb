import { Col, Row } from 'react-bootstrap';
import Collapsible from 'react-collapsible';
import { BsChevronDown } from 'react-icons/bs';

import EquipmentState from './EquipmentState';
import styles from './GenericEquipmentControl.module.css';

export default function GenericEquipment(props) {
  const { name, state, initialOpen, children } = props;

  return (
    <Row className="mb-3">
      <Col sm={12} className={styles.container}>
        <Collapsible
          triggerClassName={styles.trigger}
          triggerOpenedClassName={styles.trigger}
          open={initialOpen}
          trigger={
            <>
              <EquipmentState state={state} equipmentName={name} />
              <BsChevronDown className={styles.chevron} size="1em" />
            </>
          }
        >
          <div className={styles.content}>{children}</div>
        </Collapsible>
      </Col>
    </Row>
  );
}
