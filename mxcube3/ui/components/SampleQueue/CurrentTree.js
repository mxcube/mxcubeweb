import React from 'react';
import 'bootstrap';
import './app.less';
import TaskItem from './TaskItem';
import { Button } from 'react-bootstrap';
import { QUEUE_STOPPED, QUEUE_PAUSED, QUEUE_RUNNING } from '../../constants';

export default class CurrentTree extends React.Component {

  constructor(props) {
    super(props);
    this.moveCard = this.moveCard.bind(this);
    this.runSample = this.runSample.bind(this);
    this.unmount = this.unMountSample.bind(this);
    this.nextSample = this.nextSample.bind(this);
    this.state = {
      options: {
        [QUEUE_RUNNING]: [
        { text: 'Stop', class: 'btn-danger', action: this.props.stop, key: 1 },
        { text: 'Pause', class: 'btn-warning pull-right', action: this.props.pause, key: 2 },
        ],
        [QUEUE_STOPPED]: [
        { text: 'Run Sample', class: 'btn-success', action: this.runSample, key: 1 },
        { text: 'Next Sample', class: 'btn-primary pull-right', action: this.nextSample, key: 2 }
        ],
        [QUEUE_PAUSED]: [
        { text: 'Stop', class: 'btn-danger', action: this.props.stop, key: 1 },
        { text: 'Unpause', class: 'btn-success pull-right', action: this.props.unpause, key: 2 }
        ],
        NoSampleMounted: [
        { text: 'New Sample', class: 'btn-primary', action: this.showForm, key: 1 },
        ]
      }
    };
  }

  nextSample() {
    if (this.props.todoList[0]) {
      this.props.mount(this.props.todoList[0]);
    }
  }

  moveCard(dragIndex, hoverIndex) {
    this.props.changeOrder(this.props.mounted, dragIndex, hoverIndex);
  }

  runSample() {
    this.props.run(this.props.mounted, undefined);
  }

  unMountSample() {
    this.props.unmount(this.props.queue[this.props.mounted].queueID);
  }

  renderOptions(option) {
    return (
      <Button
        className={option.class}
        bsSize="sm"
        onClick={option.action}
        key={option.key}
      >
        {option.text}
      </Button>
    );
  }

  render() {
    const sampleId = this.props.mounted;
    let sampleData = {};
    let sampleTasks = [];
    let queueOptions = [];

    if (sampleId) {
      sampleData = this.props.queue[sampleId];
      sampleTasks = this.props.queue[sampleId].tasks;
      queueOptions = this.state.options[this.props.queueStatus];
    } else {
      sampleData.sampleName = 'Go To SampleGrid';
      queueOptions = [];
    }

    if (! this.props.show) { return <div />; }

    return (
      <div>
          <div className="list-head">
              {queueOptions.map((option) => this.renderOptions(option))}
              <p className="queue-root" onClick={this.collapse}>
                { sampleId ? `Sample: ${sampleData.sampleID}` : 'No Sample Mounted'}
              </p>
              <hr className="queue-divider" />
          </div>
          <div className="list-body">
            {sampleTasks.map((taskData, i) => {
              const key = taskData.label + taskData.parameters.run_number;
              const task =
                (<TaskItem key={key}
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
                  state={this.props.queue[taskData.sampleID].tasks[i].state}
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
