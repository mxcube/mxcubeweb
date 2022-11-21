import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import Helical from '../components/Tasks/Helical';
import Mesh from '../components/Tasks/Mesh';
import AddSample from '../components/Tasks/AddSample';
import Workflow from '../components/Tasks/Workflow';
import GphlWorkflow from '../components/Tasks/GphlWorkflow';
import Interleaved from '../components/Tasks/Interleaved';
import XRFScan from '../components/Tasks/XRFScan';
import EnergyScan from '../components/Tasks/EnergyScan';
import GenericTaskForm from '../components/Tasks/GenericTaskForm';

import {
  hideTaskParametersForm,
  showTaskForm,
  resetTaskParameters,
  updateDefaultParameters,
} from '../actions/taskForm';

import {
  addTask,
  updateTask,
  addSamplesToQueue,
  addSampleAndMount,
} from '../actions/queue';

import { addSamplesToList } from '../actions/sampleGrid';

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
      if (
        parameters.hasOwnProperty(key) &&
        !stringFields.includes(key) &&
        parameters[key]
      ) {
        parameters[key] = Number(parameters[key]);
      }
    }

    if (this.props.sampleIds.constructor === Array) {
      this.props.addTask(this.props.sampleIds, parameters, runNow);
    } else {
      const { taskData, sampleIds } = this.props;

      if (taskData.queueID === null) {
        this.props.addTask([this.props.sampleIds], parameters, runNow);
      } else {
        let taskIndex = -1;

        for (const task of this.props.sampleList[sampleIds].tasks) {
          if (task.queueID === taskData.queueID) {
            taskIndex = this.props.sampleList[sampleIds].tasks.indexOf(task);
            break;
          }
        }

        this.props.updateTask(sampleIds, taskIndex, parameters, runNow);
      }
    }

    this.props.updateDefaultParameters(params);
  }

  render() {
    const [points, lines, grids] = [{}, {}, {}];

    Object.keys(this.props.shapes).forEach((key) => {
      const shape = this.props.shapes[key];
      switch (shape.t) {
        case 'P': {
          points[shape.id] = shape;

          break;
        }
        case 'L': {
          lines[shape.id] = shape;

          break;
        }
        case 'G': {
          grids[shape.id] = shape;

          break;
        }
        // No default
      }
    });

    if (this.props.showForm === 'Characterisation') {
      return (
        <Characterisation
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
          attributes={this.props.attributes}
          initialParameters={this.props.initialParameters}
          resetTaskParameters={this.props.resetTaskParameters}
        />
      );
    } else if (this.props.showForm === 'DataCollection') {
      return (
        <DataCollection
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
          attributes={this.props.attributes}
          initialParameters={this.props.initialParameters}
          resetTaskParameters={this.props.resetTaskParameters}
          defaultParameters={this.props.defaultParameters}
          taskResult={this.props.taskResult}
        />
      );
    } else if (this.props.showForm === 'Helical') {
      return (
        <Helical
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          sampleIds={this.props.sampleIds}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
          lines={lines}
          attributes={this.props.attributes}
          initialParameters={this.props.initialParameters}
          resetTaskParameters={this.props.resetTaskParameters}
        />
      );
    } else if (this.props.showForm === 'Mesh') {
      return (
        <Mesh
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          sampleIds={this.props.sampleIds}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
          cellCount={this.props.cellCount}
          initialParameters={this.props.initialParameters}
          resetTaskParameters={this.props.resetTaskParameters}
        />
      );
    } else if (this.props.showForm === 'AddSample') {
      return (
        <AddSample
          show
          hide={this.props.hideTaskParametersForm}
          addToQueue={this.addSampleToQueue}
          addAndMount={this.addSampleAndMount}
        />
      );
    } else if (this.props.showForm === 'Workflow') {
      return (
        <Workflow
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
        />
      );
    } else if (this.props.showForm === 'GphlWorkflow') {
      return (
        <GphlWorkflow
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
        />
      );
    } else if (this.props.showForm === 'Interleaved') {
      return (
        <Interleaved
          show
          addTask={this.addTask}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
        />
      );
    } else if (this.props.showForm === 'XRF') {
      return (
        <XRFScan
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          rootPath={this.props.path}
        />
      );
    } else if (this.props.showForm === 'Energy') {
      return (
        <EnergyScan
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          availableElements={this.props.beamline.energyScanElements}
          rootPath={this.props.path}
        />
      );
    } else if (this.props.showForm === 'Generic') {
      return (
        <GenericTaskForm
          show
          addTask={this.addTask}
          pointID={this.props.pointID}
          taskData={this.props.taskData}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          availableElements={this.props.beamline.energyScanElements}
          rootPath={this.props.path}
        />
      );
    }

    return null;
  }
}

function mapStateToProps(state) {
  return {
    queue: state.queue.queue,
    beamline: state.beamline,
    sampleOrder: state.queue.sampleOrder,
    sampleList: state.sampleGrid.sampleList,
    showForm: state.taskForm.showForm,
    taskData: state.taskForm.taskData,
    sampleIds: state.taskForm.sampleIds,
    pointID: state.taskForm.pointID,
    apertureList: state.sampleview.apertureList,
    path: state.login.rootPath,
    shapes: state.shapes.shapes,
    attributes: state.beamline.attributes,
    initialParameters: state.taskForm.initialParameters,
    defaultParameters: state.taskForm.defaultParameters,
    taskResult: state.taskResult,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    hideTaskParametersForm: bindActionCreators(
      hideTaskParametersForm,
      dispatch
    ),
    resetTaskParameters: bindActionCreators(resetTaskParameters, dispatch),
    updateDefaultParameters: bindActionCreators(
      updateDefaultParameters,
      dispatch
    ),
    updateTask: bindActionCreators(updateTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
    addSamplesToList: bindActionCreators(addSamplesToList, dispatch),
    addSamplesToQueue: bindActionCreators(addSamplesToQueue, dispatch),
    addSampleAndMount: bindActionCreators(addSampleAndMount, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TaskContainer);
