/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/no-unused-state */

import { Component } from 'react';
import PropTypes from 'prop-types';
import { ProgressBar, Button, Collapse, Table } from 'react-bootstrap';
import {
  TASK_UNCOLLECTED,
  TASK_COLLECTED,
  TASK_COLLECT_FAILED,
  TASK_RUNNING,
} from '../../constants';
import TooltipTrigger from '../TooltipTrigger';

export default class TaskItem extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    moveCard: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.showForm = this.showForm.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.toggleChecked = this.toggleChecked.bind(this);
    this.taskHeaderOnClick = this.taskHeaderOnClick.bind(this);
    this.taskHeaderOnContextMenu = this.taskHeaderOnContextMenu.bind(this);
    this.getResult = this.getResult.bind(this);
    this.pointIDString = this.pointIDString.bind(this);
    this.wedgeParameters = this.wedgeParameters.bind(this);
    this.state = {
      overInput: false,
      selected: false,
    };
  }

  getResult(state) {
    if (state !== TASK_COLLECTED) {
      return (
        <div>
          <span />
        </div>
      );
    }
    return (
      <div
        style={{
          borderLeft: '1px solid #DDD',
          borderRight: '1px solid #DDD',
          borderBottom: '1px solid #DDD',
          padding: '0.5em',
        }}
      >
        <a
          href="#"
          onClick={() =>
            this.props.showDialog(
              true,
              'LIMS_RESULT_DIALOG',
              'Lims Results',
              this.props.data,
            )
          }
        >
          View Results
        </a>
      </div>
    );
  }

  toggleChecked() {
    this.props.toggleChecked(this.props.sampleId, this.props.index);
  }

  taskHeaderOnClick(e) {
    this.props.taskHeaderOnClickHandler(e, this.props.index);
  }

  taskHeaderOnContextMenu(e) {
    this.props.taskHeaderOnContextMenuHandler(e, this.props.index);
  }

  deleteTask(e) {
    e.stopPropagation();
    this.props.deleteTask(this.props.sampleId, this.props.index);
  }

  deleteButton() {
    let content = (
      <Button size="sm" onClick={this.deleteTask}>
        Delete
      </Button>
    );

    if (this.props.state !== TASK_UNCOLLECTED) {
      content = <span> </span>;
    }

    return content;
  }

  showForm() {
    const { data, sampleId, shapes } = this.props;
    const { type, parameters } = data;
    if (parameters.helical) {
      this.props.showForm('Helical', sampleId, data, parameters.shape);
    } else if (parameters.mesh) {
      const shape = shapes.shapes[parameters.shape];
      data.parameters.cell_count = shape.numCols * shape.numRows;
      this.props.showForm('Mesh', sampleId, data, parameters.shape);
    } else {
      this.props.showForm(type, sampleId, data, parameters.shape);
    }
  }

  pointIDString(wedges) {
    let res = '';

    wedges.forEach((wedge) => {
      if (
        wedge.parameters.shape !== -1 &&
        !res.includes(`${wedge.parameters.shape}`)
      ) {
        try {
          res += `${this.props.shapes.shapes[wedge.parameters.shape].name}`;
        } catch {
          res = String(res);
        }
      }
    });

    if (res !== '') {
      res += ':';
    }

    return `${res} `;
  }

  wedgePath(wedge) {
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

  wedgeParameters(wedge) {
    const { parameters } = wedge;
    return (
      <tr>
        {parameters.osc_start !== null && (
          <td>
            <a>{parameters.osc_start.toFixed(2)}</a>
          </td>
        )}
        {parameters.osc_range !== null && (
          <td>
            <a>{parameters.osc_range.toFixed(2)}</a>
          </td>
        )}
        <td>
          <a>{parameters.exp_time.toFixed(6)}</a>
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

  progressBar() {
    const { state } = this.props;
    let pbarBsStyle = 'info';

    switch (state) {
      case TASK_RUNNING: {
        pbarBsStyle = 'info';

        break;
      }
      case TASK_COLLECTED: {
        pbarBsStyle = 'success';

        break;
      }
      case TASK_COLLECT_FAILED: {
        pbarBsStyle = 'danger';

        break;
      }
      // No default
    }

    return (
      <span style={{ width: '150px', right: '60px', position: 'absolute' }}>
        <ProgressBar
          variant={pbarBsStyle}
          striped
          style={{ marginBottom: 0, height: '18px' }}
          min={0}
          max={1}
          animated={this.props.progress < 1}
          label={`${(this.props.progress * 100).toPrecision(3)} %`}
          now={this.props.progress}
        />
      </span>
    );
  }

  render() {
    const { state, data, show } = this.props;
    const wedges =
      data.type === 'Interleaved' ? data.parameters.wedges : [data];

    const delTaskCSS = {
      display: 'flex',
      marginLeft: 'auto',
      alignItems: 'center',
      paddingLeft: '10px',
      paddingRight: '10px',
      color: '#d9534f',
      cursor: 'pointer',
    };

    let taskCSS = this.props.selected
      ? 'task-head task-head-selected'
      : 'task-head';

    switch (state) {
      case TASK_RUNNING: {
        taskCSS += ' running';

        break;
      }
      case TASK_COLLECTED: {
        taskCSS += ' success';

        break;
      }
      case TASK_COLLECT_FAILED: {
        taskCSS += ' error';

        break;
      }
      // No default
    }

    return (
      <div className="node node-sample">
        <div
          onContextMenu={(e) =>
            this.props.showContextMenu(e, 'currentSampleQueueContextMenu')
          }
          id="currentSampleQueueContextMenu"
        >
          <div
            onClick={this.taskHeaderOnClick}
            onContextMenu={this.taskHeaderOnContextMenu}
          >
            <div className={taskCSS} style={{ display: 'flex' }}>
              <b>
                <span className="node-name" style={{ display: 'flex' }}>
                  {this.pointIDString(wedges)} {data.label}
                  {state === TASK_RUNNING && this.progressBar()}
                </span>
              </b>
              {state === TASK_UNCOLLECTED && (
                <i
                  className="fas fa-times"
                  onClick={this.deleteTask}
                  style={delTaskCSS}
                />
              )}
            </div>
          </div>
          <Collapse in={Boolean(show)}>
            <div className="task-body">
              {wedges.map((wedge, i) => {
                const padding = i > 0 ? '1em' : '0em';
                return (
                  <div key={`wedge-${i}`}>
                    <div
                      style={{
                        borderLeft: '1px solid #DDD',
                        borderRight: '1px solid #DDD',
                        paddingTop: padding,
                      }}
                    >
                      <div
                        style={{
                          borderTop: '1px solid #DDD',
                          padding: '0.5em',
                          display: 'flex',
                          justifyContent: 'space-around',
                          alignItems: 'center',
                        }}
                      >
                        <b>Path:</b>
                        {this.wedgePath(wedge)}
                        <Button
                          variant="outline-secondary"
                          style={{ width: '3em' }}
                          title="Copy path"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${wedge.parameters.path}`,
                            );
                          }}
                        >
                          <i
                            style={{ marginLeft: 0 }}
                            className="fa fa-copy"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>
                    <Table
                      striped
                      bordered
                      hover
                      onClick={this.showForm}
                      style={{ fontSize: 'smaller', marginBottom: 0 }}
                      className="task-parameters-table"
                    >
                      <thead>
                        <tr>
                          {wedge.parameters.osc_start !== null && (
                            <th>Start &deg; </th>
                          )}
                          {wedge.parameters.osc_range !== null && (
                            <th>Osc. &deg; </th>
                          )}
                          <th>t (s)</th>
                          <th># Img</th>
                          <th>T (%)</th>
                          <th>Res. (&Aring;)</th>
                          <th>E (keV)</th>
                          {wedge.parameters.kappa_phi !== null && (
                            <th>&phi; &deg;</th>
                          )}
                          {wedge.parameters.kappa !== null && (
                            <th>&kappa; &deg;</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>{this.wedgeParameters(wedge)}</tbody>
                    </Table>
                    {this.getResult(state)}
                  </div>
                );
              })}
            </div>
          </Collapse>
        </div>
      </div>
    );
  }
}
