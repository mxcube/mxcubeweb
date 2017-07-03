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
    this.selectTask = this.selectTask.bind(this);
    this.showInterleavedDialog = this.showInterleavedDialog.bind(this);

    this.state = { selected: {} };
  }

  moveCard(dragIndex, hoverIndex) {
    this.props.changeOrder(this.props.sampleList[this.props.mounted], dragIndex, hoverIndex);
  }

  taskHeaderOnClickHandler(e, index) {
    if (!e.ctrlKey) {
      this.props.collapseTask(this.props.mounted, index);
    } else {
      this.selectTask(index);
    }
  }

  showInterleavedDialog() {
    const taskList = Object.keys(this.state.selected).map((taskIdx) => (
      this.props.sampleList[this.props.mounted].tasks[parseInt(taskIdx, 10)]
    ));

    this.props.showForm('Interleaved',
                        [this.props.mounted],
                        { parameters: { taskIndexList: this.state.selected, taskList } },
                        -1);
  }

  selectTask(index) {
    /* eslint-disable react/no-set-state */
    this.setState({ selected: { ...this.state.selected, [index]: !this.state.selected[index] } });
    /* eslint-enable react/no-set-state */
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
              const key = taskData.label + taskData.parameters.run_number;

              const task =
                (<TaskItem
                  key={key}
                  index={i}
                  id={key}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  sampleId={sampleData.sampleID}
                  selected={this.state.selected[i]}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  rootPath={this.props.rootPath}
                  taskHeaderOnClickHandler={this.taskHeaderOnClickHandler}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.sampleID].tasks[i].collapsed}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                />);
              return task;
            })}
        </div>
        </ContextMenuTrigger>
        <ContextMenu id="currentSampleQueueContextMenu">
          <MenuItem onClick={this.showInterleavedDialog}>
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
