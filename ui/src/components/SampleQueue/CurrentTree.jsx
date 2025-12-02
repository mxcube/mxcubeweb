import { Item, Menu } from 'react-contexify';

import CharacterisationTaskItem from './CharacterisationTaskItem';
import EnergyScanTaskItem from './EnergyScanTaskItem';
import TaskItem from './TaskItem';
import styles from './Tree.module.css';
import WorkflowTaskItem from './WorkflowTaskItem';
import XRFTaskItem from './XRFTaskItem';

function CurrentTree(props) {
  const {
    show,
    sampleList,
    mounted,
    displayData,
    shapes,
    addTask,
    checked,
    plotsData,
    plotsInfo,
    showForm,
    showDialog,
    showWorkflowParametersDialog,
  } = props;

  function getSelectedTasks() {
    const selectedTasks = [];
    const taskList = sampleList[mounted] ? sampleList[mounted].tasks : [];

    taskList.forEach((task, taskIdx) => {
      const data = displayData[task.queueID];

      if (data && data.selected) {
        const tData = sampleList[mounted].tasks[Number.parseInt(taskIdx, 10)];

        if (tData) {
          selectedTasks.push(tData);
        }
      }
    });

    return selectedTasks;
  }

  function isInterleavedAvailable() {
    let available = false;
    const selectedTasks = getSelectedTasks();

    // Interleaved is only available if more than one DataCollection task is selected
    available = selectedTasks.length > 1;

    // Available if more than one item selected and only DataCollection tasks are selected.
    selectedTasks.forEach((task) => {
      if (task.type !== 'DataCollection' || task.parameters.helical === true) {
        available = false;
      }
    });

    return available;
  }

  function duplicateTask(taskIndex) {
    const task = sampleList[mounted].tasks[taskIndex];

    if (task) {
      const tpars = {
        type: task.type,
        label: task.label,
        ...task.parameters,
      };
      addTask([task.sampleID], tpars, false);
    }
  }

  function showInterleavedDialog() {
    const wedges = [];
    const taskIndexList = [];

    Object.values(sampleList[mounted].tasks).forEach((task, taskIdx) => {
      if (displayData[task.queueID].selected) {
        wedges.push(sampleList[mounted].tasks[Number.parseInt(taskIdx, 10)]);
        taskIndexList.push(taskIdx);
      }
    });

    showForm(
      'Interleaved',
      [mounted],
      { type: 'DataCollection', parameters: { taskIndexList, wedges } },
      -1,
    );
  }

  const sampleId = mounted;
  let sampleData = {};
  let sampleTasks = [];

  if (sampleId) {
    sampleData = sampleList[sampleId];
    sampleTasks = sampleData ? sampleList[sampleId].tasks : [];
  }

  if (!show) {
    return <div />;
  }

  return (
    <>
      <div className={styles.listBody}>
        {sampleTasks.map((taskData, i) => {
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
                  sampleId={sampleData.sampleID}
                  checked={checked}
                  showForm={showForm}
                  shapes={shapes}
                  showDialog={showDialog}
                  showWorkflowParametersDialog={showWorkflowParametersDialog}
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
                  sampleId={sampleData.sampleID}
                  checked={checked}
                  showForm={showForm}
                  plotsData={plotsData}
                  plotsInfo={plotsInfo}
                  showDialog={showDialog}
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
                  sampleId={sampleData.sampleID}
                  checked={checked}
                  showForm={showForm}
                  shapes={shapes}
                  showDialog={showDialog}
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
                  sampleId={sampleData.sampleID}
                  checked={checked}
                  state={sampleList[taskData.sampleID].tasks[i].state}
                  showForm={showForm}
                  addTask={addTask}
                  shapes={shapes}
                  showDialog={showDialog}
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
                  sampleId={sampleData.sampleID}
                  checked={checked}
                  showForm={showForm}
                  shapes={shapes}
                  showDialog={showDialog}
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
