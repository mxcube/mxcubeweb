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
    this.props.run(this.props.mounted);
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
    const node = this.props.mounted;
    let sampleData = {};
    let sampleTasks = [];
    let queueOptions = [];

    if (node) {
      sampleData = this.props.sampleInformation[this.props.lookup[node]];
      sampleTasks = this.props.queue[node];
      queueOptions = this.state.options[this.props.queueStatus];
    } else {
      sampleData.sampleName = 'No Sample Mounted';
      queueOptions = this.state.options.NoSampleMounted;
    }

    const bodyClass = cx('list-body', {
      hidden: (this.props.show || !node)
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
              const task =
                (<TaskItem key={taskData.queueID}
                  index={i}
                  id={taskData.queueID}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.deleteTask}
                  showForm={this.props.showForm}
                  sampleId={sampleData.id}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  rootPath={this.props.rootPath}
                  collapseNode={this.props.collapseNode}
                  show={this.props.collapsedNodes[taskData.queueID]}
                />);
              return task;
            })}
          </div>
      </div>
    );
  }
}
