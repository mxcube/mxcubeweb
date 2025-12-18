import { Item, Menu } from 'react-contexify';
import { useDispatch, useSelector } from 'react-redux';

import { addTask } from '../../actions/queue';
import { showTaskForm } from '../../actions/taskForm';
import CharacterisationTaskItem from './CharacterisationTaskItem';
import EnergyScanTaskItem from './EnergyScanTaskItem';
import TaskItem from './TaskItem';
import styles from './Tree.module.css';
import WorkflowTaskItem from './WorkflowTaskItem';
import XRFTaskItem from './XRFTaskItem';

function CurrentTree(props) {
  const { currentSample } = props;
  const { sampleID: sampleId, tasks = [] } = currentSample;

  const dispatch = useDispatch();
  const displayData = useSelector((state) => state.queueGUI.displayData);

  const selectedTasks = tasks.filter((t) => displayData[t.queueID]?.selected);

  const isInterleavedAvailable =
    selectedTasks.length > 1 &&
    selectedTasks.every(
      (t) => t.type === 'DataCollection' && !t.parameters.helical,
    );

  function duplicateTask(taskIndex) {
    const task = tasks[taskIndex];

    if (task) {
      const tpars = {
        type: task.type,
        label: task.label,
        ...task.parameters,
      };
      dispatch(addTask([task.sampleID], tpars, false));
    }
  }

  function showInterleavedDialog() {
    dispatch(
      showTaskForm(
        'Interleaved',
        [sampleId],
        {
          type: 'DataCollection',
          parameters: {
            taskIndexList: selectedTasks.map((t) => t.taskIndex),
            wedges: [...selectedTasks],
          },
        },
        -1,
      ),
    );
  }

  return (
    <>
      <div className={styles.listBody}>
        {tasks.map((taskData, i) => {
          switch (taskData.type) {
            case 'Workflow':
            case 'GphlWorkflow': {
              return (
                <WorkflowTaskItem
                  key={taskData.queueID}
                  index={i}
                  data={taskData}
                />
              );
            }
            case 'xrf_spectrum': {
              return (
                <XRFTaskItem
                  key={taskData.queueID}
                  index={i}
                  data={taskData}
                  sampleId={sampleId}
                />
              );
            }
            case 'energy_scan': {
              return (
                <EnergyScanTaskItem
                  key={taskData.queueID}
                  index={i}
                  data={taskData}
                  sampleId={sampleId}
                />
              );
            }
            case 'Characterisation': {
              return (
                <CharacterisationTaskItem
                  key={taskData.queueID}
                  index={i}
                  data={taskData}
                  sampleId={sampleId}
                />
              );
            }
            default: {
              return (
                <TaskItem
                  key={taskData.queueID}
                  index={i}
                  data={taskData}
                  sampleId={sampleId}
                />
              );
            }
          }
        })}
      </div>

      <Menu id="currentSampleQueueContextMenu">
        <Item
          onClick={() => showInterleavedDialog()}
          disabled={!isInterleavedAvailable}
        >
          Create interleaved data collection
        </Item>
        <Item onClick={({ props: pp }) => duplicateTask(pp.taskIndex)}>
          Duplicate this item
        </Item>
      </Menu>
    </>
  );
}

export default CurrentTree;
