import { Nav, Navbar } from 'react-bootstrap';
import { useSelector } from 'react-redux';

import { QUEUE_RUNNING } from '../../constants';
import QueueSettings from '../../containers/QueueSettings';
import loader from '../../img/busy-indicator.gif';
import styles from './QueueControl.module.css';
import QueueControlOptions from './QueueControlOptions';

export default function QueueControl() {
  const queueStatus = useSelector((state) => state.queue.queueStatus);

  const showBusyIndicator = queueStatus === QUEUE_RUNNING ? 'inline' : 'none';

  return (
    <Navbar className={styles.mTree}>
      <Nav
        className="me-auto my-2 my-lg-0"
        style={{ maxHeight: '100px' }}
        navbarScroll
      >
        <Nav.Item>
          <QueueControlOptions />
        </Nav.Item>
        <Nav.Item>
          <img
            src={loader}
            style={{ display: showBusyIndicator, marginLeft: '25%' }}
            alt=""
          />
        </Nav.Item>
      </Nav>
      <QueueSettings />
    </Navbar>
  );
}
