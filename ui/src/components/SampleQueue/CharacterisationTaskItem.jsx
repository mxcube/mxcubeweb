/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-array-index-key */
import { Button, Table } from 'react-bootstrap';

import { TASK_COLLECTED } from '../../constants';
import TooltipTrigger from '../TooltipTrigger';
import styles from './Item.module.css';
import TaskItemContainer from './TaskItemContainer';

function CharacterisationTaskItem(props) {
  const { index, data, sampleId, pointID, shapes, showForm, addTask } = props;
  const wedges = data.type === 'Interleaved' ? data.parameters.wedges : [data];

  function showDiffPlan() {
    const tasks = data.diffractionPlan;

    // if there is a single wedge, display the form, otherwise, add all wedges as differente dc-s
    if (tasks.length <= 1) {
      delete data.diffractionPlan[0].run_number;
      delete data.diffractionPlan[0].sampleID;
      const [{ type, parameters }] = data.diffractionPlan;

      showForm(type, sampleId, data.diffractionPlan[0], parameters.shape);
    } else {
      tasks.forEach((t) => {
        const pars = {
          type: 'DataCollection',
          label: 'Data Collection',
          helical: false,
          shape: pointID,
          ...t.parameters,
        };

        addTask([sampleId], pars, false);
      });
    }
  }

  function handleParamsTableClick() {
    const { type, parameters } = data;
    showForm(type, sampleId, data, parameters.shape);
  }

  function pointIDString() {
    let res = '';

    wedges.forEach((wedge) => {
      if (
        wedge.parameters.shape !== -1 &&
        !res.includes(`${wedge.parameters.shape}`)
      ) {
        try {
          res += `${shapes.shapes[wedge.parameters.shape].name} :`;
        } catch {
          res = String(res);
        }
      }
    });

    return `${res}`;
  }

  return (
    <TaskItemContainer
      index={index}
      data={data}
      pointIDString={pointIDString()}
    >
      <div className={styles.taskBody}>
        {wedges.map((wedge, i) => {
          const { parameters } = wedge;
          const { fileName, path = '' } = parameters;
          const pathEndPart = path.slice(-40);

          return (
            <div key={`wedge-${i}`}>
              <div
                className={styles.dataPath}
                style={{ paddingTop: i > 0 ? '1.5em' : '0.5em' }}
              >
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
                  {'diffractionPlan' in data &&
                    Object.keys(data.diffractionPlan).length > 0 && (
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
          );
        })}
      </div>
    </TaskItemContainer>
  );
}

export default CharacterisationTaskItem;
