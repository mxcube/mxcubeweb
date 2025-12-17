/* eslint-disable jsx-a11y/anchor-is-valid */

import { Button, Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { addTask } from '../../actions/queue';
import { showTaskForm } from '../../actions/taskForm';
import { TASK_COLLECTED } from '../../constants';
import TooltipTrigger from '../TooltipTrigger';
import styles from './Item.module.css';
import TaskItemContainer from './TaskItemContainer';

function CharacterisationTaskItem(props) {
  const { index, data, sampleId } = props;
  const { parameters, diffractionPlan } = data;

  const { type, fileName, path = '', shape } = parameters;
  const pathEndPart = path.slice(-40);

  const dispatch = useDispatch();
  const shapes = useSelector((state) => state.shapes);

  function showDiffPlan() {
    // If there is a single wedge, display the form; otherwise, add all wedges as different data collections
    if (diffractionPlan.length === 1) {
      const [task] = diffractionPlan;
      const { run_number, sampleID, ...taskData } = task;
      dispatch(
        showTaskForm(task.type, sampleId, taskData, task.parameters.shape),
      );
    } else {
      diffractionPlan.forEach((task) => {
        const pars = {
          type: 'DataCollection',
          label: 'Data Collection',
          helical: false,
          ...task.parameters,
        };

        dispatch(addTask([sampleId], pars, false));
      });
    }
  }

  function handleParamsTableClick() {
    dispatch(showTaskForm(type, sampleId, data, shape));
  }

  function pointIDString() {
    let res = '';

    if (shape !== -1) {
      try {
        res = `${shapes.shapes[shape].name} :`;
      } catch {
        res = '';
      }
    }

    return res;
  }

  return (
    <TaskItemContainer
      index={index}
      data={data}
      pointIDString={pointIDString()}
    >
      <div className={styles.taskBody}>
        <div className={styles.dataPath}>
          <b>Path:</b>
          <TooltipTrigger
            id="wedge-path-tooltip"
            tooltipContent={
              <>
                {path}
                {fileName}
              </>
            }
          >
            <a style={{ flexGrow: 1 }}>
              .../{pathEndPart.slice(pathEndPart.indexOf('/') + 1)}
              {fileName}
            </a>
          </TooltipTrigger>
          <Button
            variant="outline-secondary"
            style={{ width: '3em' }}
            title="Copy path"
            onClick={() => {
              navigator.clipboard.writeText(path);
            }}
          >
            <i className="fa fa-copy" aria-hidden="true" />
          </Button>
        </div>

        <Table
          striped
          bordered
          hover
          onClick={handleParamsTableClick}
          className={styles.taskParametersTable}
        >
          <thead>
            <tr>
              <th>Start &deg; </th>
              <th>Osc. &deg; </th>
              <th>t (s)</th>
              <th># Img</th>
              <th>T (%)</th>
              <th>Res. (&Aring;)</th>
              <th>E (keV)</th>
              {parameters.kappa_phi !== null && <th>&phi; &deg;</th>}
              {parameters.kappa !== null && <th>&kappa; &deg;</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a>{parameters.osc_start.toFixed(2)}</a>
              </td>
              <td>
                <a>{parameters.osc_range.toFixed(2)}</a>
              </td>
              <td>
                <a>{parameters.exp_time.toFixed(3)}</a>
              </td>
              <td>
                <a>{parameters.num_images}</a>
              </td>
              <td>
                <a>{parameters.transmission.toFixed(2)}</a>
              </td>
              <td>
                <a>{parameters.resolution.toFixed(3)}</a>
              </td>
              <td>
                <a>{parameters.energy.toFixed(4)}</a>
              </td>
              {parameters.kappa_phi !== null && (
                <td>
                  <a>{parameters.kappa_phi.toFixed(2)}</a>
                </td>
              )}
              {parameters.kappa !== null && (
                <td>
                  <a>{parameters.kappa.toFixed(2)}</a>
                </td>
              )}
            </tr>
          </tbody>
        </Table>

        {data.state === TASK_COLLECTED && (
          <div className={styles.resultBody}>
            {diffractionPlan && diffractionPlan.length > 0 && (
              <span className="float-end">
                <Button
                  size="sm"
                  style={{ width: 'auto', marginTop: '-4px' }}
                  onClick={showDiffPlan}
                >
                  <i className="fas fa-plus" />
                  Add Diffraction Plan
                </Button>
              </span>
            )}
          </div>
        )}
      </div>
    </TaskItemContainer>
  );
}

export default CharacterisationTaskItem;
