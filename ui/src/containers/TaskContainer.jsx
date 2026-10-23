import { useDispatch, useSelector } from 'react-redux';

import { addTask, updateTask } from '../actions/queue';
import { hideTaskParametersForm } from '../actions/taskForm';
import AddSample from '../components/Tasks/AddSample';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import EnergyScan from '../components/Tasks/EnergyScan';
import GenericTaskForm from '../components/Tasks/GenericTaskForm';
import Helical from '../components/Tasks/Helical';
import Interleaved from '../components/Tasks/Interleaved';
import Mesh from '../components/Tasks/Mesh';
import Workflow from '../components/Tasks/Workflow';
import XRFScan from '../components/Tasks/XRFScan';

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

  function doAddTask(params, stringFields, runNow) {
    const parameters = { ...params };

    // The form gives numbers as strings, convert them back. Other values,
    // for instance paths or lists, are kept as they are.
    for (const [key, value] of Object.entries(parameters)) {
      if (
        !stringFields.includes(key) &&
        typeof value === 'string' &&
        value.trim() !== '' &&
        !Number.isNaN(Number(value))
      ) {
        parameters[key] = Number(value);
      }
    }

    if (Array.isArray(sampleIds)) {
      dispatch(addTask(sampleIds, parameters, runNow));
    } else {
      // A queueID of -1 (or none) means the task is not queued yet, for
      // instance the collections of a diffraction plan
      const taskIndex =
        taskData.queueID === null ||
        taskData.queueID === undefined ||
        taskData.queueID === -1
          ? -1
          : sampleList[sampleIds].tasks.findIndex(
              (task) => task.queueID === taskData.queueID,
            );

      if (taskIndex === -1) {
        dispatch(addTask([sampleIds], parameters, runNow));
      } else {
        dispatch(updateTask(sampleIds, taskIndex, parameters, runNow));
      }
    }
  }

  const lines = {};
  if (shapes !== undefined) {
    Object.keys(shapes).forEach((key) => {
      const shape = shapes[key];
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
