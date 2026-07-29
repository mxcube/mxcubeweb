import { Button, Form, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import {
  setAutoMountSample,
  setCentringMethod,
  startQueue,
} from '../actions/queue';
import TaskTable from '../components/ConfirmCollectDialog/TaskTable.jsx';
import { CENTRING_METHOD, TASK_UNCOLLECTED } from '../constants';
import { showConfirmCollectDialog } from '../reducers/queueGUI';
import NumSnapshotsDropDown from './NumSnapshotsDropDown.jsx';

export default function ConfirmCollectDialog() {
  const dispatch = useDispatch();

  const currentSampleID = useSelector((state) => state.queue.current);
  const queue = useSelector((state) => state.queue.queue);
  const autoMountNext = useSelector((state) => state.queue.autoMountNext);
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const show = useSelector((state) => state.queueGUI.showConfirmCollectDialog);
  const centringMethod = useSelector((state) => state.queue.centringMethod);
  const rootPath = useSelector((state) => state.login.rootPath);

  function onOkClick() {
    const sample = currentSampleID || queue[0];
    dispatch(startQueue(autoMountNext, sample));
    dispatch(showConfirmCollectDialog(false));
  }

  function onCancelClick() {
    dispatch(showConfirmCollectDialog(false));
  }

  function autoLoopCentringOnClick(e) {
    dispatch(
      setCentringMethod(
        e.target.checked ? CENTRING_METHOD.LOOP : CENTRING_METHOD.MANUAL,
      ),
    );
  }

  function autoMountNextOnClick(e) {
    dispatch(setAutoMountSample(e.target.checked));
  }

  /**
   * Returns tasks to collect
   *
   * @return {Array} {tasks}
   */
  function tasksToCollect() {
    // Flat array of all tasks
    let samplesToDisplay = queue;

    // Making the dialog a bit more intuitive, only display the tasks for the
    // sample to be colleted when autoMountNext is false
    if (!autoMountNext) {
      const sampleID = currentSampleID || queue[0];

      if (sampleID) {
        samplesToDisplay = [sampleID];
      }
    }

    const tasks = Object.values(samplesToDisplay)
      .map((sampleID) => sampleList[sampleID] || {})
      .flatMap((sample) => sample.tasks || {});

    return tasks.filter((task) => task.state === TASK_UNCOLLECTED);
  }

  function collectText(numTasks) {
    const numSamples =
      !autoMountNext && (currentSampleID || queue[0]) ? 1 : queue.length;

    let text =
      numTasks === 0
        ? `Collecting ${numSamples} samples`
        : `Collecting ${numTasks} tasks on ${numSamples} samples`;

    if (!autoMountNext && queue.length > 1) {
      text += ', NOT auto mounting next sample';
    }

    return text;
  }

  const tasks = tasksToCollect();

  return (
    <Modal show={show}>
      <Modal.Header>
        <Modal.Title>Collect Queue ?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <b>{collectText(tasks.length)}</b>
        </p>
        <div>
          <span>
            <Form.Check
              className="mb-2"
              type="checkbox"
              defaultChecked={centringMethod === CENTRING_METHOD.LOOP}
              onClick={autoLoopCentringOnClick}
              id="auto-lopp-centring"
              label="Auto loop centring"
            />
            {queue.length > 1 && (
              <Form.Check
                className="mb-2"
                type="checkbox"
                id="auto-mount-next"
                defaultChecked={autoMountNext}
                onClick={autoMountNextOnClick}
                label="Auto mount next sample"
              />
            )}
            <NumSnapshotsDropDown align="start" />
          </span>
        </div>

        <br />
        <p style={{ color: '#337ab7' }}>
          <b>Data Root: {rootPath}</b>
        </p>
        <TaskTable tasks={tasks} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancelClick}>
          Cancel
        </Button>
        <Button variant="success" onClick={onOkClick}>
          Collect
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
