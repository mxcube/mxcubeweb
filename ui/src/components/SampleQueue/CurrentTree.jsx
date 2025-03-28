/* eslint-disable react/no-unused-state */
import './app.css';

import React from 'react';
import { contextMenu, Item, Menu } from 'react-contexify';

import CharacterisationTaskItem from './CharacterisationTaskItem';
import EnergyScanTaskItem from './EnergyScanTaskItem';
import TaskItem from './TaskItem';
import WorkflowTaskItem from './WorkflowTaskItem';
import XRFTaskItem from './XRFTaskItem';

export default class CurrentTree extends React.Component {
  constructor(props) {
    super(props);
    this.moveCard = this.moveCard.bind(this);
    this.taskHeaderOnClickHandler = this.taskHeaderOnClickHandler.bind(this);
    this.taskHeaderOnContextMenuHandler =
      this.taskHeaderOnContextMenuHandler.bind(this);
    this.showInterleavedDialog = this.showInterleavedDialog.bind(this);
    this.interleavedAvailable = this.interleavedAvailable.bind(this);
    this.selectedTasks = this.selectedTasks.bind(this);
    this.duplicateTask = this.duplicateTask.bind(this);
    this.state = { showContextMenu: false, taskIndex: -1 };
  }

  selectedTasks() {
    const selectedTasks = [];
    const taskList = this.props.sampleList[this.props.mounted]
      ? this.props.sampleList[this.props.mounted].tasks
      : [];

    taskList.forEach((task, taskIdx) => {
      const displayData = this.props.displayData[task.queueID];

      if (displayData && displayData.selected) {
        const tData =
          this.props.sampleList[this.props.mounted].tasks[
            Number.parseInt(taskIdx, 10)
          ];

        if (tData) {
          selectedTasks.push(tData);
        }
      }
    });

    return selectedTasks;
  }

  showContextMenu(event, id) {
    contextMenu.show({
      id,
      event,
    });
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
    const task =
      this.props.sampleList[this.props.mounted].tasks[this.state.taskIndex];

    if (task) {
      const tpars = {
        type: task.type,
        label: task.label,
        ...task.parameters,
      };
      this.props.addTask([task.sampleID], tpars, false);
    }
  }

  moveCard(dragIndex, hoverIndex) {
    this.props.changeOrder(
      this.props.sampleList[this.props.mounted],
      dragIndex,
      hoverIndex,
    );
  }

  taskHeaderOnClickHandler(e, index) {
    const task = this.props.sampleList[this.props.mounted].tasks[index];
    if (!e.ctrlKey) {
      this.props.collapseItem(task.queueID);
    } else {
      this.props.selectItem(task.queueID);
    }
  }

  taskHeaderOnContextMenuHandler(_e, index) {
    this.setState({ showContextMenu: true, taskIndex: index });
  }

  showInterleavedDialog() {
    const wedges = [];
    const taskIndexList = [];

    Object.values(this.props.sampleList[this.props.mounted].tasks).forEach(
      (task, taskIdx) => {
        if (this.props.displayData[task.queueID].selected) {
          wedges.push(
            this.props.sampleList[this.props.mounted].tasks[
              Number.parseInt(taskIdx, 10)
            ],
          );
          taskIndexList.push(taskIdx);
        }
      },
    );

    this.props.showForm(
      'Interleaved',
      [this.props.mounted],
      { type: 'DataCollection', parameters: { taskIndexList, wedges } },
      -1,
    );
  }

  render() {
    const sampleId = this.props.mounted;
    let sampleData = {};
    let sampleTasks = [];

    if (sampleId) {
      sampleData = this.props.sampleList[sampleId];
      sampleTasks = sampleData ? this.props.sampleList[sampleId].tasks : [];
    }

    if (!this.props.show) {
      return <div />;
    }
    return (
      <div>
        <div style={{ top: '6%', height: '69%' }} className="list-body">
          {sampleTasks.map((taskData, i) => {
            let task = null;
            const displayData = this.props.displayData[taskData.queueID] || {};

            switch (taskData.type) {
              case 'Workflow':
              case 'GphlWorkflow': {
                task = (
                  <WorkflowTaskItem
                    key={taskData.queueID}
                    index={i}
                    id={`${taskData.queueID}`}
                    data={taskData}
                    moveCard={this.moveCard}
                    deleteTask={this.props.deleteTask}
                    sampleId={sampleData.sampleID}
                    selected={displayData.selected}
                    checked={this.props.checked}
                    toggleChecked={this.props.toggleCheckBox}
                    taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                    taskHeaderOnContextMenuHandler={
                      this.taskHeaderOnContextMenuHandler
                    }
                    state={
                      this.props.sampleList[taskData.sampleID].tasks[i].state
                    }
                    show={displayData.collapsed}
                    progress={displayData.progress}
                    moveTask={this.props.moveTask}
                    showForm={this.props.showForm}
                    shapes={this.props.shapes}
                    showDialog={this.props.showDialog}
                    showContextMenu={this.showContextMenu}
                    showWorkflowParametersDialog={
                      this.props.showWorkflowParametersDialog
                    }
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
                    moveCard={this.moveCard}
                    deleteTask={this.props.deleteTask}
                    sampleId={sampleData.sampleID}
                    selected={displayData.selected}
                    checked={this.props.checked}
                    toggleChecked={this.props.toggleCheckBox}
                    taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                    taskHeaderOnContextMenuHandler={
                      this.taskHeaderOnContextMenuHandler
                    }
                    state={
                      this.props.sampleList[taskData.sampleID].tasks[i].state
                    }
                    show={displayData.collapsed}
                    progress={displayData.progress}
                    moveTask={this.props.moveTask}
                    showForm={this.props.showForm}
                    plotsData={this.props.plotsData}
                    plotsInfo={this.props.plotsInfo}
                    showDialog={this.props.showDialog}
                    showContextMenu={this.showContextMenu}
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
                    moveCard={this.moveCard}
                    deleteTask={this.props.deleteTask}
                    sampleId={sampleData.sampleID}
                    selected={displayData.selected}
                    checked={this.props.checked}
                    toggleChecked={this.props.toggleCheckBox}
                    taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                    taskHeaderOnContextMenuHandler={
                      this.taskHeaderOnContextMenuHandler
                    }
                    state={
                      this.props.sampleList[taskData.sampleID].tasks[i].state
                    }
                    show={displayData.collapsed}
                    progress={displayData.progress}
                    moveTask={this.props.moveTask}
                    showForm={this.props.showForm}
                    shapes={this.props.shapes}
                    showDialog={this.props.showDialog}
                    showContextMenu={this.showContextMenu}
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
                    moveCard={this.moveCard}
                    deleteTask={this.props.deleteTask}
                    sampleId={sampleData.sampleID}
                    selected={displayData.selected}
                    checked={this.props.checked}
                    toggleChecked={this.props.toggleCheckBox}
                    taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                    taskHeaderOnContextMenuHandler={
                      this.taskHeaderOnContextMenuHandler
                    }
                    state={
                      this.props.sampleList[taskData.sampleID].tasks[i].state
                    }
                    show={displayData.collapsed}
                    progress={displayData.progress}
                    moveTask={this.props.moveTask}
                    showForm={this.props.showForm}
                    addTask={this.props.addTask}
                    shapes={this.props.shapes}
                    showDialog={this.props.showDialog}
                    showContextMenu={this.showContextMenu}
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
                    moveCard={this.moveCard}
                    deleteTask={this.props.deleteTask}
                    sampleId={sampleData.sampleID}
                    selected={displayData.selected}
                    checked={this.props.checked}
                    toggleChecked={this.props.toggleCheckBox}
                    taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                    taskHeaderOnContextMenuHandler={
                      this.taskHeaderOnContextMenuHandler
                    }
                    state={
                      this.props.sampleList[taskData.sampleID].tasks[i].state
                    }
                    show={displayData.collapsed}
                    progress={displayData.progress}
                    moveTask={this.props.moveTask}
                    showForm={this.props.showForm}
                    shapes={this.props.shapes}
                    showDialog={this.props.showDialog}
                    showContextMenu={this.showContextMenu}
                  />
                );
              }
            }

            return task;
          })}
        </div>
        <Menu id="currentSampleQueueContextMenu">
          <Item
            onClick={this.showInterleavedDialog}
            disabled={!this.interleavedAvailable()}
          >
            Create interleaved data collection
          </Item>
          <Item onClick={this.duplicateTask}>Duplicate this item</Item>
        </Menu>
      </div>
    );
  }
}
