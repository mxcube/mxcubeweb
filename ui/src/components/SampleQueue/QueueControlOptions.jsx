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

  switch (queueStatus) {
    case QUEUE_RUNNING: {
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
    case QUEUE_STOPPED: {
      let buttonText = 'Unmount';
      let buttonStyle = 'primary';
      // If there is a next sample in the queue, set the button text and style accordingly
      if (currentSampleID) {
        const idx = queue.indexOf(currentSampleID);
        if (queue.length > idx + 1) {
          const sampleData = sampleList[queue[idx + 1]] || {};
          const sampleName = sampleData.sampleName || '';
          const proteinAcronym = sampleData.proteinAcronym
            ? `${sampleData.proteinAcronym} - `
            : '';
          buttonText = `Next Sample (${proteinAcronym}${sampleName})`;
          buttonStyle = 'outline-secondary';
        }
      }

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
            <Button variant={buttonStyle} onClick={getNextSample}>
              {buttonText}
            </Button>
          )}
        </div>
      );
    }
    case QUEUE_PAUSED: {
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
    default: {
      return null;
    }
  }
}
