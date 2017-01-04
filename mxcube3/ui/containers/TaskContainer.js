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
  addSampleManualMount
} from '../actions/queue';

import {
  selectAction,
} from '../actions/SamplesGrid';


class TaskContainer extends React.Component {
  constructor(props) {
    super(props);
    this.addSample = this.addSample.bind(this);
    this.addTask = this.addTask.bind(this);
  }

  addSample(sampleData) {
    this.props.addSampleManualMount(sampleData);
    this.props.selectSamples([sampleData.sampleID], true);
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
          pointId={this.props.pointId}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'Characterisation'}
          rootPath={this.props.path}
        />

        <DataCollection
          addTask={this.addTask}
          pointId={this.props.pointId}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'DataCollection'}
          rootPath={this.props.path}
        />

        <Helical
          addTask={this.addTask}
          pointId={this.props.pointId}
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
          add={this.addSample}
          id={this.props.manualMountID}
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
    pointId: state.taskForm.pointId,
    manualMountID: state.queue.manualMount.id,
    apertureList: state.sampleview.apertureList,
    path: state.queue.rootPath,
    lines: state.sampleview.lines
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    hideTaskParametersForm: bindActionCreators(hideTaskParametersForm, dispatch),
    selectSamples: bindActionCreators(selectAction, dispatch),
    updateTask: bindActionCreators(updateTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
    addSampleManualMount: bindActionCreators(addSampleManualMount, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskContainer);

