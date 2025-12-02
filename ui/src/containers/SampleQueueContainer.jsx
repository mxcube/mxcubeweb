import { Nav, Stack } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { showDialog } from '../actions/general';
import { addTask } from '../actions/queue';
import { showList } from '../actions/queueGUI';
import { showTaskForm } from '../actions/taskForm';
import { showWorkflowParametersDialog } from '../actions/workflow';
import UserMessage from '../components/Notify/UserMessage';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import TodoTree from '../components/SampleQueue/TodoTree';
import loader from '../img/loader.gif';
import styles from './SampleQueueContainer.module.css';

function SampleQueueContainer() {
  const dispatch = useDispatch();

  const checked = useSelector((state) => state.queue.checked);
  const currentSampleID = useSelector((state) => state.queue.currentSampleID);
  const sampleOrder = useSelector((state) => state.sampleGrid.order);
  const queue = useSelector((state) => state.queue.queue);
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const displayData = useSelector((state) => state.queueGUI.displayData);
  const visibleList = useSelector((state) => state.queueGUI.visibleList);
  const loading = useSelector((state) => state.queueGUI.loading);
  const plotsData = useSelector((state) => state.beamline.plotsData);
  const plotsInfo = useSelector((state) => state.beamline.plotsInfo);
  const shapes = useSelector((state) => state.shapes);

  // go through the queue, check if sample has been collected or not
  // to make todo lists
  const todo = [];

  for (const key of sampleOrder) {
    if (queue.includes(key)) {
      const sample = sampleList[key];

      if (sample.sampleID !== currentSampleID && sample.checked) {
        todo.push(sample.sampleID);
      }
    }
  }

  let sampleName = '';
  let proteinAcronym = '';

  if (currentSampleID) {
    const sampleData = sampleList[currentSampleID] || {};
    sampleName = sampleData.sampleName || '';
    proteinAcronym = sampleData.proteinAcronym
      ? `${sampleData.proteinAcronym} -`
      : '';
  }

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
              <b>
                {currentSampleID
                  ? `Sample: ${proteinAcronym} ${sampleName}`
                  : 'Current'}
              </b>
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
          <CurrentTree
            show={visibleList === 'current'}
            mounted={currentSampleID}
            sampleList={sampleList}
            checked={checked}
            showForm={(...args) => dispatch(showTaskForm(...args))}
            displayData={displayData}
            addTask={(...args) => dispatch(addTask(...args))}
            plotsData={plotsData}
            plotsInfo={plotsInfo}
            shapes={shapes}
            showDialog={(...args) => dispatch(showDialog(...args))}
            showWorkflowParametersDialog={(...args) => {
              dispatch(showWorkflowParametersDialog(...args));
            }}
          />
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
