import React from 'react';
import 'bootstrap';
import './app.less';
import cx from 'classnames';
import TaskItem from './TaskItem';
import { Button } from 'react-bootstrap';

export default class CurrentTree extends React.Component {

  constructor(props) {
    super(props);
    this.moveCard = this.moveCard.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.collapse = props.collapse.bind(this, 'current');
    this.runSample = this.runSample.bind(this);
    this.unmount = this.unMountSample.bind(this);
    this.showForm = this.props.showForm.bind(this, 'AddSample');
    this.state = {
      options: {
        QueueStarted: [
        { text: 'Stop', color: 'danger', action: this.props.stop, key: 1 },
        { text: 'Pause', color: 'warning', action: this.props.pause, key: 2 },
        ],
        QueueStopped: [
        { text: 'New Sample', color: 'primary', action: this.showForm, key: 1 },
        { text: 'Unmount', color: 'danger', action: this.unmount, key: 2 },
        { text: 'Run', color: 'success', action: this.runSample, key: 3 }
        ],
        QueuePaused: [
        { text: 'Stop', color: 'danger', action: this.props.stop, key: 1 },
        { text: 'Unpause', color: 'success', action: this.props.unpause, key: 2 }
        ],
        NoSampleMounted: [
        { text: 'New Sample', color: 'primary', action: this.showForm, key: 1 },
        ]
      }
    };
  }

  moveCard(dragIndex, hoverIndex) {
    this.props.changeOrder(this.props.mounted, dragIndex, hoverIndex);
  }

  deleteTask(taskData) {
    this.props.deleteTask(taskData, taskData.queueID);
  }

  runSample() {
    this.props.setQueueAndRun(this.props.mounted, this.props.queue);
    //this.props.run(this.props.mounted);
  }

  unMountSample() {
    this.props.unmount(this.props.mounted);
  }

  renderOptions(option, length) {
    const width = 100 / length;
    return (
      <Button
        bsStyle={option.color}
        bsSize="sm"
        style={{ width: `${width}%` }}
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
      sampleData = this.props.sampleInformation[sampleId];
      sampleTasks = this.props.queue[sampleId];
      queueOptions = this.state.options[this.props.queueStatus];
    } else {
      sampleData.sampleName = 'No Sample Mounted';
      queueOptions = this.state.options.NoSampleMounted;
    }

    const bodyClass = cx('list-body', {
      hidden: (this.props.show || !sampleId)
    });

    return (
      <div className="m-tree">
          <div className="list-head">
              <p className="queue-root" onClick={this.collapse}>{sampleData.sampleName}</p>
              {queueOptions.map((option) => this.renderOptions(option, queueOptions.length))}
              <hr className="queue-divider" />
          </div>
          <div className={bodyClass}>
            {sampleTasks.map((taskData, i) => {
              const key = this.props.queue[taskData.sampleID].indexOf(taskData);
              const task =
                (<TaskItem key={key}
                  index={i}
                  id={key}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.deleteTask}
                  showForm={this.props.showForm}
                  sampleId={sampleData.id}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  rootPath={this.props.rootPath}
                  collapseTask={this.props.collapseTask}
                  show={taskData.collapsed}
                />);
              return task;
            })}
          </div>
      </div>
    );
  }
}
