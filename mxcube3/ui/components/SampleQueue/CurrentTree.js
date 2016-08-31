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
    this.collapse = props.collapse.bind(this, 'current');
    this.runSample = this.runSample.bind(this);
    this.unmount = this.unMountSample.bind(this);
    this.showForm = this.props.showForm.bind(this, 'AddSample');
    this.state = {
      options: {
        QueueStarted: [
          { text: 'Stop',
            class: 'btn btn-sm btn-danger',
            action: this.props.stop,
            key: 1
          },
          { text: 'Pause',
            class: 'btn btn-sm btn-warning',
            action: this.props.pause,
            key: 2
          },
        ],
        QueueStopped: [
          { text: 'Run',
            class: 'btn btn-sm btn-success',
            action: this.runSample,
            key: 1
          },
          { text: 'Next Sample',
            class: 'btn btn-sm btn-info pull-right',
            action: this.runSample,
            key: 2
          },
        ],
        QueueStoppedManual: [
          { text: 'New Sample',
            class: 'btn btn-sm btn-primary',
            action: this.showForm,
            key: 1
          },
          { text: 'Unmount',
            class: 'btn btn-sm btn-danger',
            action: this.unmount,
            key: 2
          },
          { text: 'Run',
            class: 'btn btn-sm btn-success',
            action: this.runSample,
            key: 3
          }
        ],
        QueuePaused: [
          { text: 'Stop',
            class: 'btn btn-sm btn-danger',
            action: this.props.stop,
            key: 1
          },
          { text: 'Resume',
            class: 'btn btn-sm btn-success',
            action: this.props.unpause,
            key: 2
          }
        ],
        NoSampleMounted: [
          { text: 'New Sample',
            class: 'btn btn-sm btn-primary',
            action: this.showForm,
            key: 1
          },
        ]
      }
    };
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
        onClick={option.action}
        key={option.key}
      >
        {option.text}
      </Button>
    );
  }

  renderSampleName(sampleData) {
    if (sampleData.sampleName && sampleData.proteinAcronym) {
      return `${sampleData.id} ${sampleData.proteinAcronym} - ${sampleData.sampleName} `;
    }

    if (!sampleData.sampleName) {
      return `${sampleData.id} ${sampleData.proteinAcronym} `;
    } else if (!sampleData.proteinAcronym) {
      return `${sampleData.id} ${sampleData.sampleName}`;
    }
    return `${sampleData.id} `;
  }

  renderQueueHeader(queueOptions, sampleData) {
    return (
      <div>
        <div>
          { queueOptions.map((option) => this.renderOptions(option, queueOptions.length)) }
        </div>
        <hr className="queue-divider" />
      <div> <b> {this.renderSampleName(sampleData)} </b></div>
      </div>
    );
  }

  render() {
    const sampleId = this.props.mounted;
    let sampleData = {};
    let sampleTasks = [];
    let queueOptions = [];

    if (sampleId) {
      sampleData = this.props.sampleInformation[sampleId];
      sampleTasks = this.props.queue[sampleId].tasks;
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
            {this.renderQueueHeader(queueOptions, sampleData)}
          </div>
          <div className={bodyClass}>
            {sampleTasks.map((taskData, i) => {
              const key = this.props.queue[taskData.sampleID].tasks.indexOf(taskData);
              const task =
                (<TaskItem key={key}
                  index={i}
                  id={key}
                  data={taskData}
                  moveCard={this.moveCard}
                  deleteTask={this.props.deleteTask}
                  showForm={this.props.showForm}
                  sampleId={sampleData.sampleID}
                  checked={this.props.checked}
                  toggleChecked={this.props.toggleCheckBox}
                  rootPath={this.props.rootPath}
                  collapseTask={this.props.collapseTask}
                  show={this.props.displayData[taskData.sampleID].tasks[key].collapsed}
                  state={this.props.displayData[taskData.sampleID].tasks[key].state}
                  progress={this.props.displayData[taskData.sampleID].tasks[key].progress}
                />);
              return task;
            })}
          </div>
      </div>
    );
  }
}
