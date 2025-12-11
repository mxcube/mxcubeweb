import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import {
  pauseQueue,
  resumeQueue,
  runSample,
  setEnabledSample,
  stopQueue,
} from '../../actions/queue';
import { showConfirmCollectDialog } from '../../actions/queueGUI';
import { unmountSample } from '../../actions/sampleChanger';
import { QUEUE_PAUSED, QUEUE_RUNNING, QUEUE_STOPPED } from '../../constants';
import { getSampleName } from '../../utils';

export default function QueueControlOptions() {
  const dispatch = useDispatch();

  const queueStatus = useSelector((state) => state.queue.queueStatus);
  const queue = useSelector((state) => state.queue.queue);
  const currentSampleID = useSelector((state) => state.queue.currentSampleID);
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);

  if (!queue) {
    return null;
  }

  function getNextSample() {
    const idx = queue.indexOf(currentSampleID);

    if (idx !== -1) {
      // a sample is mounted but not in the queue.
      dispatch(setEnabledSample([queue[idx]], false));
    }

    if (queue[idx + 1]) {
      dispatch(runSample(queue[idx + 1]));
    } else {
      dispatch(unmountSample());
    }
  }

  if (queueStatus === QUEUE_RUNNING) {
    return (
      <div>
        <Button
          variant="danger"
          style={{ marginRight: '0.6em' }}
          onClick={() => dispatch(stopQueue())}
        >
          Stop
        </Button>
        {currentSampleID && (
          <Button variant="warning" onClick={() => dispatch(pauseQueue())}>
            Pause
          </Button>
        )}
      </div>
    );
  }

  if (queueStatus === QUEUE_STOPPED) {
    const currentIndex = currentSampleID ? queue.indexOf(currentSampleID) : -1;
    const nextSample =
      queue.length > currentIndex + 1
        ? sampleList[queue[currentIndex + 1]]
        : undefined;

    return (
      <div>
        <Button
          variant="success"
          style={{ marginRight: '0.6em' }}
          onClick={() => dispatch(showConfirmCollectDialog())}
        >
          Run Queue
        </Button>
        {currentSampleID && (
          <Button
            variant={nextSample ? 'outline-secondary' : 'primary'}
            onClick={getNextSample}
          >
            {nextSample
              ? `Next Sample (${getSampleName(nextSample)})`
              : 'Unmount'}
          </Button>
        )}
      </div>
    );
  }

  if (queueStatus === QUEUE_PAUSED) {
    return (
      <div>
        <Button
          variant="danger"
          style={{ marginRight: '0.6em' }}
          onClick={() => dispatch(stopQueue())}
        >
          Stop
        </Button>
        {currentSampleID && (
          <Button variant="success" onClick={() => dispatch(resumeQueue())}>
            Resume
          </Button>
        )}
      </div>
    );
  }

  return null;
}
