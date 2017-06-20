import React from 'react';
import './app.less';
import TaskItem from './TaskItem';

export default class CurrentTree extends React.Component {

  constructor(props) {
    super(props);
    this.moveCard = this.moveCard.bind(this);
  }

  moveCard(dragIndex, hoverIndex) {
    this.props.changeOrder(this.props.sampleList[this.props.mounted], dragIndex, hoverIndex);
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
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  rootPath={this.props.rootPath}
                  collapseTask={this.props.collapseTask}
                  state={this.props.sampleList[taskData.sampleID].tasks[i].state}
                  show={this.props.displayData[taskData.sampleID].tasks[i].collapsed}
                  moveTask={this.props.moveTask}
                  showForm={this.props.showForm}
                />);
              return task;
            })}
          </div>
      </div>
    );
  }
}
