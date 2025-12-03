import { Nav, Stack } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { showList } from '../actions/queueGUI';
import UserMessage from '../components/Notify/UserMessage';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import TodoTree from '../components/SampleQueue/TodoTree';
import loader from '../img/loader.gif';
import styles from './SampleQueueContainer.module.css';

function SampleQueueContainer() {
  const dispatch = useDispatch();

  const currentSampleID = useSelector((state) => state.queue.currentSampleID);
  const sampleOrder = useSelector((state) => state.sampleGrid.order);
  const queue = useSelector((state) => state.queue.queue);
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const visibleList = useSelector((state) => state.queueGUI.visibleList);
  const loading = useSelector((state) => state.queueGUI.loading);

  // Find samples in the queue that have not yet been collected
  const todo = sampleOrder
    .filter((id) => queue.includes(id))
    .map((id) => sampleList[id])
    .filter((sample) => sample.sampleID !== currentSampleID && sample.checked);

  const currentSample = currentSampleID
    ? sampleList[currentSampleID]
    : undefined;

  const currentTabLabel = currentSample
    ? `Sample: ${
        currentSample.proteinAcronym ? `${currentSample.proteinAcronym} - ` : ''
      }${currentSample.sampleName}`
    : 'Current';

  return (
    <Stack className="flex-grow-1" gap={3}>
      <QueueControl />

      <div className={styles.queue}>
        <Nav
          className={styles.queueNav}
          variant="tabs"
          fill
          justify
          defaultActiveKey="current"
          activeKey={visibleList}
          onSelect={(selectedKey) => dispatch(showList(selectedKey))}
        >
          <Nav.Item>
            <Nav.Link eventKey="current" className={styles.queueNavLink}>
              <b>{currentTabLabel}</b>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="todo" className={styles.queueNavLink}>
              <b>Queued Samples ({todo.length})</b>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <div className={styles.queueBody}>
          {loading && (
            <div className={styles.loader} style={{ zIndex: '1000' }}>
              <img src={loader} className="img-fluid" width="100" alt="" />
            </div>
          )}
          {visibleList === 'current' && currentSample && (
            <CurrentTree
              currentSample={currentSample}
              sampleList={sampleList}
            />
          )}
          {visibleList === 'todo' && <TodoTree list={todo} />}
        </div>
      </div>

      <div className={styles.logs}>
        <div className={styles.logsHeader}>
          <span className="fas fa-md fa-info-circle me-2" />
          Log messages
        </div>
        <div className={styles.logsBody}>
          <UserMessage />
        </div>
      </div>
    </Stack>
  );
}

export default SampleQueueContainer;
