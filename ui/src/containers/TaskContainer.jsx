import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import Helical from '../components/Tasks/Helical';
import Mesh from '../components/Tasks/Mesh';
import AddSample from '../components/Tasks/AddSample';
import Workflow from '../components/Tasks/Workflow';
import Interleaved from '../components/Tasks/Interleaved';
import XRFScan from '../components/Tasks/XRFScan';
import EnergyScan from '../components/Tasks/EnergyScan';
import GenericTaskForm from '../components/Tasks/GenericTaskForm';

import { hideTaskParametersForm } from '../actions/taskForm';

import { addTask, updateTask } from '../actions/queue';

function TaskContainer() {
  const dispatch = useDispatch();

  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const showForm = useSelector((state) => state.taskForm.showForm);
  const taskData = useSelector((state) => state.taskForm.taskData);
  const sampleIds = useSelector((state) => state.taskForm.sampleIds);
  const pointID = useSelector((state) => state.taskForm.pointID);
  const apertureList = useSelector((state) => state.sampleview.apertureList);
  const path = useSelector((state) => state.login.rootPath);
  const shapes = useSelector((state) => state.shapes.shapes);
  const attributes = useSelector((state) => state.beamline.attributes);
  const taskResult = useSelector((state) => state.taskResult);
  const defaultParameters = useSelector(
    (state) => state.taskForm.defaultParameters,
  );
  const energyScanElements = useSelector(
    (state) => state.beamline.energyScanElements,
  );

  // eslint-disable-next-line sonarjs/cognitive-complexity
  function doAddTask(params, stringFields, runNow) {
    const parameters = { ...params };

    for (const key in parameters) {
      if (key in parameters && !stringFields.includes(key) && parameters[key]) {
        parameters[key] = Number(parameters[key]);
      }
    }

    if (Array.isArray(sampleIds)) {
      dispatch(addTask(sampleIds, parameters, runNow));
    } else {
      if (taskData.queueID === null) {
        dispatch(addTask([sampleIds], parameters, runNow));
      } else {
        let taskIndex = -1;

        for (const task of sampleList[sampleIds].tasks) {
          if (task.queueID === taskData.queueID) {
            taskIndex = sampleList[sampleIds].tasks.indexOf(task);
            break;
          }
        }

        dispatch(updateTask(sampleIds, taskIndex, parameters, runNow));
      }
    }
  }

  const lines = {};
  if (shapes !== undefined) {
    Object.keys(shapes).forEach((key) => {
      const shape = shapes[key];
      // eslint-disable-next-line sonarjs/no-small-switch
      switch (shape.t) {
        case 'L': {
          lines[shape.id] = shape;
          break;
        }
        // No default
      }
    });
  }

  switch (showForm) {
    case 'Characterisation': {
      return (
        <Characterisation
          show
          addTask={doAddTask}
          pointID={pointID}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          rootPath={path}
          attributes={attributes}
          defaultParameters={defaultParameters}
        />
      );
    }
    case 'DataCollection': {
      return (
        <DataCollection
          show
          addTask={doAddTask}
          pointID={pointID}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          rootPath={path}
          attributes={attributes}
          defaultParameters={defaultParameters}
          taskResult={taskResult}
        />
      );
    }
    case 'Helical': {
      return (
        <Helical
          show
          addTask={doAddTask}
          pointID={pointID}
          sampleIds={sampleIds}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          rootPath={path}
          lines={lines}
          attributes={attributes}
        />
      );
    }
    case 'Mesh': {
      return (
        <Mesh
          show
          addTask={doAddTask}
          pointID={pointID}
          sampleIds={sampleIds}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          rootPath={path}
        />
      );
    }
    case 'AddSample': {
      return <AddSample />;
    }
    case 'Workflow':
    case 'GphlWorkflow': {
      return (
        <Workflow
          show
          addTask={doAddTask}
          pointID={pointID}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          rootPath={path}
        />
      );
    }
    case 'Interleaved': {
      return (
        <Interleaved
          show
          addTask={doAddTask}
          pointID={pointID}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          rootPath={path}
          attributes={attributes}
          defaultParameters={defaultParameters}
          taskResult={taskResult}
        />
      );
    }
    case 'xrf_spectrum': {
      return (
        <XRFScan
          show
          addTask={doAddTask}
          pointID={pointID}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          rootPath={path}
        />
      );
    }
    case 'energy_scan': {
      return (
        <EnergyScan
          show
          addTask={doAddTask}
          pointID={pointID}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          availableElements={energyScanElements}
          rootPath={path}
        />
      );
    }
    case 'Generic': {
      return (
        <GenericTaskForm
          show
          addTask={doAddTask}
          pointID={pointID}
          taskData={taskData}
          hide={() => dispatch(hideTaskParametersForm())}
          apertureList={apertureList}
          availableElements={energyScanElements}
          rootPath={path}
          defaultParameters={defaultParameters}
        />
      );
    }
    // No default
  }

  return null;
}

export default TaskContainer;
