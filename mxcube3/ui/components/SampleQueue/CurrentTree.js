import React from 'react';
import './app.less';
import TaskItem from './TaskItem';
import XRFTaskItem from './XRFTaskItem';
import EnergyScanTaskItem from './EnergyScanTaskItem';
import WorkflowTaskItem from './WorkflowTaskItem';
import CharacterisationTaskItem from './CharacterisationTaskItem';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import '../context-menu-style.css';

export default class CurrentTree extends React.Component {

  constructor(props) {
    super(props);
    this.moveCard = this.moveCard.bind(this);
    this.taskHeaderOnClickHandler = this.taskHeaderOnClickHandler.bind(this);
    this.taskHeaderOnContextMenuHandler = this.taskHeaderOnContextMenuHandler.bind(this);
    this.showInterleavedDialog = this.showInterleavedDialog.bind(this);
    this.interleavedAvailable = this.interleavedAvailable.bind(this);
    this.selectedTasks = this.selectedTasks.bind(this);
    this.duplicateTask = this.duplicateTask.bind(this);
    this.state = { showContextMenu: false, taskIndex: -1 };
  }

  selectedTasks() {
    const selectedTasks = [];
    const taskList = this.props.mounted ? this.props.sampleList[this.props.mounted].tasks : [];

    taskList.forEach((task, taskIdx) => {
      if (this.props.displayData[task.queueID].selected) {
        const tData = this.props.sampleList[this.props.mounted].tasks[parseInt(taskIdx, 10)];

        if (tData) {
          selectedTasks.push(tData);
        }
      }
    });

    return selectedTasks;
  }

  interleavedAvailable() {
    let available = false;
    const selectedTasks = this.selectedTasks();

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

  duplicateTask() {
    const task = this.props.sampleList[this.props.mounted].tasks[this.state.taskIndex];

    if (task) {
      const tpars = { type: task.type,
                      label: task.label,
                      ...task.parameters };
      this.props.addTask([task.sampleID], tpars, false);
    }
  }

  moveCard(dragIndex, hoverIndex) {
    this.props.changeOrder(this.props.sampleList[this.props.mounted], dragIndex, hoverIndex);
  }

  taskHeaderOnClickHandler(e, index) {
    const task = this.props.sampleList[this.props.mounted].tasks[index];
    if (!e.ctrlKey) {
      this.props.collapseItem(task.queueID);
    } else {
      this.props.selectItem(task.queueID);
    }
  }

  taskHeaderOnContextMenuHandler(e, index) {
    this.setState({ showContextMenu: true, taskIndex: index });
  }

  showInterleavedDialog() {
    const wedges = [];
    const taskIndexList = [];

    Object.values(this.props.sampleList[this.props.mounted].tasks).forEach((task, taskIdx) => {
      if (this.props.displayData[task.queueID].selected) {
        wedges.push(this.props.sampleList[this.props.mounted].tasks[parseInt(taskIdx, 10)]);
        taskIndexList.push(taskIdx);
      }
    });

    this.props.showForm('Interleaved',
                        [this.props.mounted],
                        { parameters: { taskIndexList, wedges } },
                        -1);
  }

  render() {
    const sampleId = this.props.mounted;
    let sampleData = {};
    let sampleTasks = [];

    if (sampleId) {
      sampleData = this.props.sampleList[sampleId];
      sampleTasks = sampleData ? this.props.sampleList[sampleId].tasks : [];
    }

    if (! this.props.show) { return <div />; }

    return (
      <div>
        <div style={{ top: 'initial' }} className="list-body" >
          {sampleTasks.map((taskData, i) => {
            let task = null;

            if (taskData.type === 'Workflow') {
              task =
                (<WorkflowTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  sampleId={sampleData.sampleID}
                  selected={this.props.displayData[taskData.queueID].selected}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                  taskHeaderOnContextMenuHandler={this.taskHeaderOnContextMenuHandler}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.queueID].collapsed}
                  progress={this.props.displayData[taskData.queueID].progress}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                  shapes={this.props.shapes}
                  showDialog={this.props.showDialog}
                />);
            } else if (taskData.type === 'XRFScan') {
              task =
                (<XRFTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  sampleId={sampleData.sampleID}
                  selected={this.props.displayData[taskData.queueID].selected}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                  taskHeaderOnContextMenuHandler={this.taskHeaderOnContextMenuHandler}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.queueID].collapsed}
                  progress={this.props.displayData[taskData.queueID].progress}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                  plotsData={this.props.plotsData}
                  plotsInfo={this.props.plotsInfo}
                  showDialog={this.props.showDialog}
                />);
            } else if (taskData.type === 'EnergyScan') {
              task =
                (<EnergyScanTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  sampleId={sampleData.sampleID}
                  selected={this.props.displayData[taskData.queueID].selected}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                  taskHeaderOnContextMenuHandler={this.taskHeaderOnContextMenuHandler}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.queueID].collapsed}
                  progress={this.props.displayData[taskData.queueID].progress}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                  shapes={this.props.shapes}
                  showDialog={this.props.showDialog}
                />);
            } else if (taskData.type === 'Characterisation') {
              task =
                (<CharacterisationTaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  sampleId={sampleData.sampleID}
                  selected={this.props.displayData[taskData.queueID].selected}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                  taskHeaderOnContextMenuHandler={this.taskHeaderOnContextMenuHandler}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.queueID].collapsed}
                  progress={this.props.displayData[taskData.queueID].progress}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                  addTask={this.props.addTask}
                  shapes={this.props.shapes}
                  showDialog={this.props.showDialog}
                />);
            } else {
              task =
                (<TaskItem
                  key={taskData.queueID}
                  index={i}
                  id={`${taskData.queueID}`}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  sampleId={sampleData.sampleID}
                  selected={this.props.displayData[taskData.queueID].selected}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                  taskHeaderOnContextMenuHandler={this.taskHeaderOnContextMenuHandler}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.queueID].collapsed}
                  progress={this.props.displayData[taskData.queueID].progress}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                  shapes={this.props.shapes}
                  showDialog={this.props.showDialog}
                />);
            }

            return task;
          })}
        </div>
        <ContextMenu id="currentSampleQueueContextMenu">
          <MenuItem onClick={this.showInterleavedDialog} disabled={!this.interleavedAvailable()}>
            Create interleaved data collection
          </MenuItem>
          <MenuItem onClick={this.duplicateTask}>
            Duplicate this item
          </MenuItem>
        </ContextMenu>
      </div>
    );
  }
}
