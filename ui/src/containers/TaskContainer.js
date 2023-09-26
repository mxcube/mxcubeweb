import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import Helical from '../components/Tasks/Helical';
import Mesh from '../components/Tasks/Mesh';
import AddSampleContainer from '../components/Tasks/AddSample';
import Workflow from '../components/Tasks/Workflow';
import GphlWorkflow from '../components/Tasks/GphlWorkflow';
import Interleaved from '../components/Tasks/Interleaved';
import XRFScan from '../components/Tasks/XRFScan';
import EnergyScan from '../components/Tasks/EnergyScan';
import GenericTaskForm from '../components/Tasks/GenericTaskForm';

import { hideTaskParametersForm, showTaskForm } from '../actions/taskForm';

import { addTask, updateTask } from '../actions/queue';

class TaskContainer extends React.Component {
  constructor(props) {
    super(props);
    this.addTask = this.addTask.bind(this);
  }

  addTask(params, stringFields, runNow) {
    const parameters = { ...params };

    for (const key in parameters) {
      if (key in parameters && !stringFields.includes(key) && parameters[key]) {
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
  }

  render() {
    const [points, lines, grids] = [{}, {}, {}];
    if (typeof this.props.shapes !== 'undefined') {
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
    }
    switch (this.props.showForm) {
      case 'Characterisation': {
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
            defaultParameters={this.props.defaultParameters}
          />
        );
      }
      case 'DataCollection': {
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
            defaultParameters={this.props.defaultParameters}
            taskResult={this.props.taskResult}
          />
        );
      }
      case 'Helical': {
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
          />
        );
      }
      case 'Mesh': {
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
          />
        );
      }
      case 'AddSample': {
        return (
          <AddSampleContainer show hide={this.props.hideTaskParametersForm} />
        );
      }
      case 'Workflow': {
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
      }
      case 'GphlWorkflow': {
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
      }
      case 'Interleaved': {
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
      }
      case 'xrf_spectrum': {
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
      }
      case 'energy_scan': {
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
      }
      case 'Generic': {
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
      // No default
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
    defaultParameters: state.taskForm.defaultParameters,
    taskResult: state.taskResult,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    hideTaskParametersForm: bindActionCreators(
      hideTaskParametersForm,
      dispatch,
    ),
    updateTask: bindActionCreators(updateTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TaskContainer);
