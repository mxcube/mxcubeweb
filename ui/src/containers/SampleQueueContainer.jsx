import { useEffect } from 'react';
import { Nav, Stack } from 'react-bootstrap';

import UserMessage from '../components/Notify/UserMessage';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import TodoTree from '../components/SampleQueue/TodoTree';
import SSXChip from '../components/SSXChip/SSXChip';
import { QUEUE_PAUSED, QUEUE_RUNNING, TASK_UNCOLLECTED } from '../constants';
import loader from '../img/loader.gif';
import { showList } from '../reducers/queueGUI';
import { useAppDispatch, useAppSelector } from '../ts-store';
import { getSampleName } from '../utils';
import styles from './SampleQueueContainer.module.css';

function SampleQueueContainer() {
  const dispatch = useAppDispatch();

  const currentSampleID = useAppSelector((state) => state.queue.current);
  const sampleOrder = useAppSelector((state) => state.sampleGrid.order);
  const queue = useAppSelector((state) => state.queue.queue);
  const sampleList = useAppSelector((state) => state.sampleGrid.sampleList);
  const visibleList = useAppSelector((state) => state.queueGUI.visibleList);
  const loading = useAppSelector((state) => state.queueGUI.loading);

  const queueStatus = useAppSelector((state) => state.queue.queueStatus);

  const mode = useAppSelector((state) => state.general.mode);

  // "Running now" is the live view of a run, it has nothing to show otherwise
  const active = queueStatus === QUEUE_RUNNING || queueStatus === QUEUE_PAUSED;
  const tab = !active && visibleList === 'current' ? 'todo' : visibleList;

  useEffect(() => {
    if (active) {
      dispatch(showList('current'));
    }
  }, [active, dispatch]);

  // Find samples in the queue that have not yet been collected
  const todo = sampleOrder
    .filter((id) => queue.includes(id))
    .map((id) => sampleList[id])
    .filter((sample) => sample.sampleID !== currentSampleID && sample.checked);

  // Samples the queue is finished with stay listed, with their results
  const done = sampleOrder
    .filter((id) => queue.includes(id) && id !== currentSampleID)
    .map((id) => sampleList[id])
    .filter(
      (sample) =>
        !sample.checked &&
        sample.tasks.some((task) => task.state !== TASK_UNCOLLECTED),
    );

  const currentSample = currentSampleID
    ? sampleList[currentSampleID]
    : undefined;

  const runningIcon =
    queueStatus === QUEUE_PAUSED ? (
      <i className="fas fa-pause me-2" />
    ) : (
      <span className={styles.spinner} />
    );

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
          activeKey={tab}
          onSelect={(selectedKey) => dispatch(showList(selectedKey))}
        >
          <Nav.Item>
            <Nav.Link
              eventKey="current"
              disabled={!active}
              className={active ? styles.liveTab : styles.idleTab}
              title={active ? undefined : 'Nothing is running'}
            >
              {active && runningIcon}
              <b>
                Running now
                {active &&
                  currentSample &&
                  ` · ${getSampleName(currentSample)}`}
              </b>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="todo">
              <i className="fas fa-list-ul me-2" />
              <b>Queued Samples ({todo.length})</b>
            </Nav.Link>
          </Nav.Item>
          {mode === 'SSX-CHIP' && (
            <Nav.Item>
              <Nav.Link eventKey="chip" className="queue-nav-link">
                <i className="fas fa-braille" /> &nbsp; <b>Chip callibration</b>
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        <div className={styles.queueBody}>
          {loading && (
            <div className={styles.loader} style={{ zIndex: '1000' }}>
              <img src={loader} className="img-fluid" width="100" alt="" />
            </div>
          )}
          {tab !== 'chip' && (
            <div className={styles.caption}>
              {tab === 'current'
                ? 'Live: what the queue is executing now'
                : 'Plan: the samples and tasks waiting to run'}
            </div>
          )}
          {tab === 'current' && currentSample && (
            <CurrentTree currentSample={currentSample} />
          )}
          {tab === 'todo' && (
            <TodoTree list={[...todo, ...done]} mounted={currentSample} />
          )}
          {tab === 'chip' && mode === 'SSX-CHIP' && <SSXChip />}
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
