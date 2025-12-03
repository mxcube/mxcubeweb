import { Item, Menu } from 'react-contexify';
import { useDispatch, useSelector } from 'react-redux';

import { showDialog } from '../../actions/general';
import { addTask } from '../../actions/queue';
import { showTaskForm } from '../../actions/taskForm';
import { showWorkflowParametersDialog } from '../../actions/workflow';
import CharacterisationTaskItem from './CharacterisationTaskItem';
import EnergyScanTaskItem from './EnergyScanTaskItem';
import TaskItem from './TaskItem';
import styles from './Tree.module.css';
import WorkflowTaskItem from './WorkflowTaskItem';
import XRFTaskItem from './XRFTaskItem';

function CurrentTree(props) {
  const { sampleList, currentSample } = props;
  const { sampleID: sampleId, tasks = [] } = currentSample;

  const dispatch = useDispatch();

  const checked = useSelector((state) => state.queue.checked);
  const displayData = useSelector((state) => state.queueGUI.displayData);
  const plotsData = useSelector((state) => state.beamline.plotsData);
  const plotsInfo = useSelector((state) => state.beamline.plotsInfo);
  const shapes = useSelector((state) => state.shapes);

  function getSelectedTasks() {
    const selectedTasks = [];

    tasks.forEach((task) => {
      const data = displayData[task.queueID];
      if (data && data.selected) {
        selectedTasks.push(task);
      }
    });

    return selectedTasks;
  }

  function isInterleavedAvailable() {
    const selectedTasks = getSelectedTasks();

    // Interleaved is only available if more than one DataCollection task is selected
    let available = selectedTasks.length > 1;

    // Available if more than one item selected and only DataCollection tasks are selected.
    selectedTasks.forEach((task) => {
      if (task.type !== 'DataCollection' || task.parameters.helical === true) {
        available = false;
      }
    });

    return available;
  }

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
    const wedges = [];
    const taskIndexList = [];

    Object.values(tasks).forEach((task, taskIdx) => {
      if (displayData[task.queueID].selected) {
        wedges.push(tasks[Number.parseInt(taskIdx, 10)]);
        taskIndexList.push(taskIdx);
      }
    });

    dispatch(
      showTaskForm(
        'Interleaved',
        [sampleId],
        { type: 'DataCollection', parameters: { taskIndexList, wedges } },
        -1,
      ),
    );
  }

  return (
    <>
      <div className={styles.listBody}>
        {tasks.map((taskData, i) => {
          let task = null;

          switch (taskData.type) {
            case 'Workflow':
            case 'GphlWorkflow': {
              task = (
                <WorkflowTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  sampleId={sampleId}
                  checked={checked}
                  showForm={(...args) => dispatch(showTaskForm(...args))}
                  shapes={shapes}
                  showDialog={(...args) => dispatch(showDialog(...args))}
                  showWorkflowParametersDialog={(...args) => {
                    dispatch(showWorkflowParametersDialog(...args));
                  }}
                />
              );

              break;
            }
            case 'xrf_spectrum': {
              task = (
                <XRFTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  sampleId={sampleId}
                  checked={checked}
                  showForm={(...args) => dispatch(showTaskForm(...args))}
                  plotsData={plotsData}
                  plotsInfo={plotsInfo}
                  showDialog={(...args) => dispatch(showDialog(...args))}
                />
              );

              break;
            }
            case 'energy_scan': {
              task = (
                <EnergyScanTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  sampleId={sampleId}
                  checked={checked}
                  showForm={(...args) => dispatch(showTaskForm(...args))}
                  shapes={shapes}
                  showDialog={(...args) => dispatch(showDialog(...args))}
                />
              );

              break;
            }
            case 'Characterisation': {
              task = (
                <CharacterisationTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  sampleId={sampleId}
                  checked={checked}
                  state={sampleList[taskData.sampleID].tasks[i].state}
                  showForm={(...args) => dispatch(showTaskForm(...args))}
                  addTask={addTask}
                  shapes={shapes}
                  showDialog={(...args) => dispatch(showDialog(...args))}
                />
              );

              break;
            }
            default: {
              task = (
                <TaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  sampleId={sampleId}
                  checked={checked}
                  showForm={(...args) => dispatch(showTaskForm(...args))}
                  shapes={shapes}
                  showDialog={(...args) => dispatch(showDialog(...args))}
                />
              );
            }
          }

          return task;
        })}
      </div>

      <Menu id="currentSampleQueueContextMenu">
        <Item
          onClick={() => showInterleavedDialog()}
          disabled={!isInterleavedAvailable()}
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
