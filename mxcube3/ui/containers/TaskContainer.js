import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import Helical from '../components/Tasks/Helical';
import AddSample from '../components/Tasks/AddSample';
import { hideTaskParametersForm, showTaskForm } from '../actions/taskForm';


import {
  addTask,
  updateTask,
  addSamplesToQueue,
  addSampleAndMount
} from '../actions/queue';

import {
  addSamplesToList
} from '../actions/sampleGrid';


class TaskContainer extends React.Component {
  constructor(props) {
    super(props);
    this.addSampleToQueue = this.addSampleToQueue.bind(this);
    this.addSampleAndMount = this.addSampleAndMount.bind(this);
    this.addTask = this.addTask.bind(this);
  }

  addSampleToQueue(sampleData) {
    this.props.addSamplesToList([sampleData]);
    this.props.addSamplesToQueue([sampleData]);
  }

  addSampleAndMount(sampleData) {
    this.props.addSamplesToList([sampleData]);
    this.props.addSampleAndMount(sampleData);
  }

  addTask(params, stringFields, runNow) {
    const parameters = { ...params };

    for (const key in parameters) {
      if (parameters.hasOwnProperty(key) && stringFields.indexOf(key) === -1 && parameters[key]) {
        parameters[key] = Number(parameters[key]);
      }
    }

    if (this.props.sampleIds.constructor === Array) {
      this.props.addTask(this.props.sampleIds, parameters, runNow);
    } else {
      const { taskData, sampleIds } = this.props;
      const taskIndex = this.props.queue[sampleIds].tasks.indexOf(taskData);
      this.props.updateTask(sampleIds, taskIndex, parameters, runNow);
    }
  }

  render() {
    return (
      <div className="col-xs-12">
        <Characterisation
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'Characterisation'}
          rootPath={this.props.path}
        />

        <DataCollection
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'DataCollection'}
          rootPath={this.props.path}
        />

        <Helical
          addTask={this.addTask}
          pointID={this.props.pointID}
          sampleIds={this.props.sampleIds}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'Helical'}
          rootPath={this.props.path}
          lines={this.props.lines}
        />

        <AddSample
          hide={this.props.hideTaskParametersForm}
          show={this.props.showForm === 'AddSample'}
          addToQueue={this.addSampleToQueue}
          addAndMount={this.addSampleAndMount}
        />
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    queue: state.queue.queue,
    sampleOrder: state.queue.sampleOrder,
    sampleList: state.queue.sampleList,
    showForm: state.taskForm.showForm,
    taskData: state.taskForm.taskData,
    sampleIds: state.taskForm.sampleIds,
    pointID: state.taskForm.pointID,
    apertureList: state.sampleview.apertureList,
    path: state.queue.rootPath,
    lines: state.sampleview.lines
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    hideTaskParametersForm: bindActionCreators(hideTaskParametersForm, dispatch),
    updateTask: bindActionCreators(updateTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
    addSamplesToList: bindActionCreators(addSamplesToList, dispatch),
    addSamplesToQueue: bindActionCreators(addSamplesToQueue, dispatch),
    addSampleAndMount: bindActionCreators(addSampleAndMount, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskContainer);

