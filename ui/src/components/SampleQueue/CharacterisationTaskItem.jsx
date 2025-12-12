/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-array-index-key */
import { Button, Table } from 'react-bootstrap';

import { TASK_COLLECTED } from '../../constants';
import TooltipTrigger from '../TooltipTrigger';
import styles from './Item.module.css';
import TaskItemContainer from './TaskItemContainer';

function TaskItem(props) {
  function getResult(_state, data) {
    if (props.data.state !== TASK_COLLECTED) {
      return <span />;
    }

    return <div className={styles.resultBody}>{getDiffPlan(data)}</div>;
  }

  function getDiffPlan(data) {
    let diffPlan = [];
    if (
      'diffractionPlan' in data &&
      Object.keys(data.diffractionPlan).length > 0
    ) {
      // it can be empty
      diffPlan = (
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
      );
    }
    return diffPlan;
  }

  function showDiffPlan() {
    const { data, sampleId } = props;
    const tasks = data.diffractionPlan;

    // if there is a single wedge, display the form, otherwise, add all wedges as differente dc-s
    if (tasks.length <= 1) {
      delete data.diffractionPlan[0].run_number;
      delete data.diffractionPlan[0].sampleID;
      const [{ type, parameters }] = data.diffractionPlan;

      props.showForm(type, sampleId, data.diffractionPlan[0], parameters.shape);
    } else {
      tasks.forEach((t) => {
        const pars = {
          type: 'DataCollection',
          label: 'Data Collection',
          helical: false,
          shape: props.pointID,
          ...t.parameters,
        };

        props.addTask([sampleId], pars, false);
      });
    }
  }

  function showForm() {
    const { data, sampleId } = props;
    const { type, parameters } = data;
    props.showForm(type, sampleId, data, parameters.shape);
  }

  function pointIDString(wedges) {
    let res = '';

    wedges.forEach((wedge) => {
      if (
        wedge.parameters.shape !== -1 &&
        !res.includes(`${wedge.parameters.shape}`)
      ) {
        try {
          res += `${props.shapes.shapes[wedge.parameters.shape].name} :`;
        } catch {
          res = String(res);
        }
      }
    });

    return `${res}`;
  }

  function wedgePath(wedge) {
    const { parameters } = wedge;
    const value = parameters.fileName;
    const path = parameters.path || '';
    const pathEndPart = path.slice(-40);

    return (
      <TooltipTrigger
        id="wedge-path-tooltip"
        tooltipContent={
          <>
            {path}
            {value}
          </>
        }
      >
        <a style={{ flexGrow: 1 }}>
          .../{pathEndPart.slice(pathEndPart.indexOf('/') + 1)}
          {value}
        </a>
      </TooltipTrigger>
    );
  }

  function wedgeParameters(wedge) {
    const { parameters } = wedge;

    return (
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
    );
  }

  const { data, state } = props;
  const wedges = data.type === 'Interleaved' ? data.parameters.wedges : [data];

  return (
    <TaskItemContainer
      index={props.index}
      data={data}
      pointIDString={pointIDString(wedges)}
    >
      <div className={styles.taskBody}>
        {wedges.map((wedge, i) => {
          const padding = i > 0 ? '1.5em' : '0.5em';
          return (
            <div key={`wedge-${i}`}>
              <div
                className={styles.dataPath}
                style={{
                  paddingTop: padding,
                }}
              >
                <b>Path:</b>
                {wedgePath(wedge)}
                <Button
                  variant="outline-secondary"
                  style={{ width: '3em' }}
                  title="Copy path"
                  onClick={() => {
                    navigator.clipboard.writeText(`${wedge.parameters.path}`);
                  }}
                >
                  <i className="fa fa-copy" aria-hidden="true" />
                </Button>
              </div>
              <Table
                striped
                bordered
                hover
                onClick={showForm}
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
                    {wedge.parameters.kappa_phi !== null && (
                      <th>&phi; &deg;</th>
                    )}
                    {wedge.parameters.kappa !== null && <th>&kappa; &deg;</th>}
                  </tr>
                </thead>
                <tbody>{wedgeParameters(wedge)}</tbody>
              </Table>
              {getResult(state, data)}
            </div>
          );
        })}
      </div>
    </TaskItemContainer>
  );
}

export default TaskItem;
