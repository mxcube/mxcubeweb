import React from 'react';
import './app.less';
import TaskItem from './TaskItem';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import '../context-menu-style.css';

export default class CurrentTree extends React.Component {

  constructor(props) {
    super(props);
    this.moveCard = this.moveCard.bind(this);
    this.taskHeaderOnClickHandler = this.taskHeaderOnClickHandler.bind(this);
    this.showInterleavedDialog = this.showInterleavedDialog.bind(this);
    this.interleavedAvailable = this.interleavedAvailable.bind(this);
  }

  interleavedAvailable() {
    let available = false;
    const taskList = this.props.mounted ? this.props.sampleList[this.props.mounted].tasks : [];
    const selectedTasks = [];

    taskList.forEach((task, taskIdx) => {
      if (this.props.displayData[task.queueID].selected) {
        const tData = this.props.sampleList[this.props.mounted].tasks[parseInt(taskIdx, 10)];

        if (tData) {
          selectedTasks.push(tData);
        }
      }
    });

    // Interleaved is only available if more than one DataCollection task is selected
    available = selectedTasks.length > 1;

    // Available if more than one item selected and only DataCollection tasks are selected.
    selectedTasks.forEach((task) => {
      if (task.type !== 'DataCollection') {
        available = false;
      }
    });

    return available;
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
        <ContextMenuTrigger id="currentSampleQueueContextMenu">
        <div style={{ top: 'initial' }} className="list-body">
            {sampleTasks.map((taskData, i) => {
              const task =
                (<TaskItem
                  key={taskData.queueID}
                  index={i}
                  id={taskData.queueID}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  sampleId={sampleData.sampleID}
                  selected={this.props.displayData[taskData.queueID].selected}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.queueID].collapsed}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                />);
              return task;
            })}
        </div>
        </ContextMenuTrigger>
        <ContextMenu id="currentSampleQueueContextMenu">
          <MenuItem onClick={this.showInterleavedDialog} disabled={!this.interleavedAvailable()}>
            Create interleaved data collection
          </MenuItem>
          <MenuItem>
            Delete selected items
          </MenuItem>
        </ContextMenu>
      </div>
    );
  }
}
