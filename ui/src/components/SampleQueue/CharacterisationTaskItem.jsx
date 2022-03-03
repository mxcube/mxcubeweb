import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ProgressBar,
  Button,
  Collapse,
  Table,
  OverlayTrigger,
  Popover,
} from 'react-bootstrap';
import { ContextMenuTrigger } from 'react-contextmenu';
import {
  TASK_UNCOLLECTED,
  TASK_COLLECTED,
  TASK_COLLECT_FAILED,
  TASK_RUNNING,
} from '../../constants';

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
    this.showDiffPlan = this.showDiffPlan.bind(this);
    this.pointIDString = this.pointIDString.bind(this);
    this.state = {
      overInput: false,
      selected: false,
    };
  }

  getResult(state, data) {
    if (this.props.data.state !== TASK_COLLECTED) {
      return <span />;
    }

    const link = this.props.data.limsResultData
      ? this.props.data.limsResultData.limsTaskLink
      : '#';

    if (link === '#') {
      return <span />;
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
              this.props.data
            )
          }
        >
          View Results
        </a>
        {this.getDiffPlan(data)}
      </div>
    );
  }

  getDiffPlan(data) {
    let diffPlan = [];
    if (data.hasOwnProperty('diffractionPlan') && Object.keys(data.diffractionPlan).length > 0) {
        // it can be empty
        diffPlan = (
          <span className="pull-right">
            <Button
              bsSize="xs"
              style={{ width: 'auto', marginTop: '-4px' }}
              onClick={this.showDiffPlan}
            >
              <i className="glyphicon glyphicon-plus" />
              Add Diffraction Plan
            </Button>
          </span>
        );
      }
    return diffPlan;
  }

  showDiffPlan() {
    const { data, sampleId } = this.props;
    const tasks = data.diffractionPlan;

    // if there is a single wedge, display the form, otherwise, add all wedges as differente dc-s
    if (tasks.length <= 1) {
      delete data.diffractionPlan[0].run_number;
      delete data.diffractionPlan[0].sampleID;
      const { type, parameters } = data.diffractionPlan[0];

      this.props.showForm(
        type,
        sampleId,
        data.diffractionPlan[0],
        parameters.shape
      );
    } else {
      tasks.forEach((t) => {
        const pars = {
          type: 'DataCollection',
          label: 'Data Collection',
          helical: false,
          shape: this.props.pointID,
          ...t.parameters,
        };

        this.props.addTask([sampleId], pars, false);
      });
    }
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
      <Button bsSize="sm" onClick={this.deleteTask}>
        Delete
      </Button>
    );

    if (this.props.state !== TASK_UNCOLLECTED) {
      content = <span> </span>;
    }

    return content;
  }

  showForm() {
    const { data, sampleId } = this.props;
    const { type, parameters } = data;
    this.props.showForm(type, sampleId, data, parameters.shape);
  }

  pointIDString(wedges) {
    let res = '';

    wedges.forEach((wedge) => {
      if (
        wedge.parameters.shape !== -1 &&
        !res.includes(`${wedge.parameters.shape}`)
      ) {
        try {
          res += `${this.props.shapes.shapes[wedge.parameters.shape].name} :`;
        } catch {
          res = String(res);
        }
      }
    });

    return `${res}`;
  }

  wedgePath(wedge) {
    const {parameters} = wedge;
    const value = parameters.fileName;
    const path = parameters.path ? parameters.path : '';

    return (
      <OverlayTrigger
        trigger="click"
        placement="top"
        rootClose
        overlay={
          <Popover
            id="wedge-popover"
            style={{ maxWidth: '600px', width: 'auto' }}
          >
            <input
              type="text"
              onFocus={(e) => {
                e.target.select();
              }}
              value={path}
              size={path.length + 10}
            />
          </Popover>
        }
      >
        <a>{value}</a>
      </OverlayTrigger>
    );
  }

  wedgeParameters(wedge) {
    const {parameters} = wedge;

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
        <td>
          <a>{parameters.kappa_phi.toFixed(2)}</a>
        </td>
        <td>
          <a>{parameters.kappa.toFixed(2)}</a>
        </td>
      </tr>
    );
  }

  progressBar() {
    const {state} = this.props;
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
          bsStyle={pbarBsStyle}
          striped
          style={{ marginBottom: '0px', height: '18px' }}
          min={0}
          max={1}
          active={this.props.progress < 1}
          label={`${(this.props.progress * 100).toPrecision(3)} %`}
          now={this.props.progress}
        />
      </span>
    );
  }

  render() {
    const { state, data, show } = this.props;
    let wedges = [];

    if (data.type === 'Interleaved') {
      wedges = data.parameters.wedges;
    } else {
      wedges = [data];
    }

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

    taskCSS += ' uncollected';

    if (state === TASK_RUNNING) {
      taskCSS += ' running';
    } else if (state === TASK_COLLECTED && data.diffractionPlan.length > 0) {
      taskCSS += ' success';
    } else if (
      state === TASK_COLLECTED &&
      data.diffractionPlan.length === undefined
    ) {
      taskCSS += ' warning';
    } else if (state === TASK_COLLECT_FAILED) {
      taskCSS += ' error';
    }

    return (
      <div className="node node-sample">
        <ContextMenuTrigger id="currentSampleQueueContextMenu">
          <div
            onClick={this.taskHeaderOnClick}
            onContextMenu={this.taskHeaderOnContextMenu}
          >
            <div className={taskCSS} style={{ display: 'flex' }}>
              <b>
                <span className="node-name" style={{ display: 'flex' }}>
                  {this.pointIDString(wedges)} {data.label}
                  {state === TASK_RUNNING ? this.progressBar() : null}
                </span>
              </b>
              {state === TASK_UNCOLLECTED ? (
                <i
                  className="fas fa-remove"
                  onClick={this.deleteTask}
                  style={delTaskCSS}
                />
              ) : null}
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
                          }}
                        >
                          <b>Path:</b> {this.wedgePath(wedge)}
                        </div>
                      </div>
                      <Table
                        striped
                        condensed
                        bordered
                        hover
                        onClick={this.showForm}
                        style={{ fontSize: 'smaller', marginBottom: '0px' }}
                        className="task-parameters-table"
                      >
                        <thead>
                          <tr>
                            <th>Start &deg; </th>
                            <th>Osc. &deg; </th>
                            <th>t (ms)</th>
                            <th># Img</th>
                            <th>T (%)</th>
                            <th>Res. (&Aring;)</th>
                            <th>E (KeV)</th>
                            <th>&phi; &deg;</th>
                            <th>&kappa; &deg;</th>
                          </tr>
                        </thead>
                        <tbody>{this.wedgeParameters(wedge)}</tbody>
                      </Table>
                      {this.getResult(state, data)}
                    </div>
                  );
                })}
              </div>
            </Collapse>
          </div>
        </ContextMenuTrigger>
      </div>
    );
  }
}
