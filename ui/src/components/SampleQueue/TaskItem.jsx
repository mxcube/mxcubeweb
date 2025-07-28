/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-unused-prop-types */

import PropTypes from 'prop-types';
import { Component } from 'react';
import { Button, Table } from 'react-bootstrap';

import TooltipTrigger from '../TooltipTrigger';
import styles from './Item.module.css';
import TaskItemContainer from './TaskItemContainer';

export default class TaskItem extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
    this.showForm = this.showForm.bind(this);
    this.pointIDString = this.pointIDString.bind(this);
    this.wedgeParameters = this.wedgeParameters.bind(this);
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

  render() {
    const { data } = this.props;
    const wedges =
      data.type === 'Interleaved' ? data.parameters.wedges : [data];

    return (
      <TaskItemContainer
        index={this.props.index}
        data={data}
        pointIDString={this.pointIDString(wedges)}
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
                  {this.wedgePath(wedge)}
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
                  onClick={this.showForm}
                  className={styles.taskParametersTable}
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
              </div>
            );
          })}
        </div>
      </TaskItemContainer>
    );
  }
}
