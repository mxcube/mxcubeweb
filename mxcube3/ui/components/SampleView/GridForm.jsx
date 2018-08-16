import './SampleView.css';
import React from 'react';
import { Form, FormGroup, FormControl, ControlLabel,
         Button, Checkbox, Table } from 'react-bootstrap';
import Draggable from 'react-draggable';


export default class GridForm extends React.Component {

  getGridControls() {
    const gridControlList = [];

    for (const grid of Object.values(this.props.gridList)) {
      const selectedStyle = this.props.selectedGrids.includes(grid.id) ? 'selected' : '';
      const vdim = grid.numRows * (grid.cellHeight + grid.cellVSpace);
      const hdim = grid.numCols * (grid.cellWidth + grid.cellHSpace);

      gridControlList.push((
        <tr
          className={selectedStyle}
          key={grid.name}
          onClick={(e) => this.props.selectGrid([grid], e.ctrlKey)}
        >
          <td>
            <span style={{ lineHeight: '24px' }}>{grid.name}</span>
          </td>
          <td>
            {grid.cellVSpace.toFixed(2)}
          </td>
          <td>
            {grid.cellHSpace.toFixed(2)}
          </td>
          <td>
            {vdim} x {hdim}
          </td>
          <td>
            ({grid.numRows * grid.numCols})
          </td>
          <td>
            { grid.motorPositions.phi.toFixed(2) }&deg;
          </td>
          <td>
            <Button
              className="btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                this.props.rotateTo(grid.id);
              }}
            >
              Rotate to
            </Button>
          </td>
          <td>
            <Button
              className="btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                this.props.toggleVisibility(grid.id);
              }}
            >
              {grid.state === 'HIDDEN' ? 'Show' : 'Hide '}
            </Button>
          </td>
          <td>
            <Button
              className="btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                this.props.removeGrid(grid.id);
              }}
            >
              -
            </Button>
          </td>
        </tr>));
    }

    gridControlList.push((
        <tr key="current-grid">
          <td>
            <span style={{ lineHeight: '24px' }}>*</span>
          </td>
          <td>
            <Form>
              <FormControl
                style={{ width: '50px' }}
                type="text"
                defaultValue={0}
                onChange={this.props.setVCellSpacing}
              />
            </Form>
          </td>
          <td>
            <Form>
              <FormControl
                style={{ width: '50px' }}
                type="text"
                defaultValue={0}
                onChange={this.props.setHCellSpacing}
              />
            </Form>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
          </td>
          <td>
            <Button className="btn-sm" onClick={() => this.props.saveGrid()}>
              +
            </Button>
          </td>
        </tr>));

    return gridControlList;
  }

  render() {
    const gridForm = (
      <Draggable defaultPosition={{ x: 20, y: 50 }} cancel={"form"}>
        <div className="gridform">
          <div className="col-xs-8">
            <Table
              striped
              hover
              responsive
              condensed
            >
              <thead>
                <tr>
                  <th>
                    Name
                  </th>
                  <th>
                    V-Space (µm)
                  </th>
                  <th>
                    H-Space (µm)
                  </th>
                  <th>
                    Dim (µm)
                  </th>
                  <th>
                    #Cells
                  </th>
                  <th>
                    &Omega;
                  </th>
                  <th />
                  <th />
                  <th />
                </tr>
              </thead>
              <tbody>
                {this.getGridControls()}
              </tbody>
           </Table>
          </div>
          <div className="col-xs-4" style={{ marginTop: '20px' }}>
            <Form inline>
              <FormGroup>
                <ControlLabel>Opacity: </ControlLabel>
                <FormControl
                  style={{ width: '100px', padding: '0', marginLeft: '10px', marginRight: '1em' }}
                  className="bar"
                  type="range"
                  id="overlay-control"
                  min="0" max="1"
                  step="0.05"
                  defaultValue={this.props.getGridOverlayOpacity()}
                  onChange={this.props.setGridOverlayOpacity}
                  ref="overlaySlider"
                  name="overlaySlider"
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Heat map: </ControlLabel>
                <Checkbox style={{ marginLeft: '10px' }} />
              </FormGroup>
            </Form>
          </div>
        </div>
      </Draggable>);

    return this.props.show ? gridForm : null;
  }
}

GridForm.defaultProps = {
  show: true
};
