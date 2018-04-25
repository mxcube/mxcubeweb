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
                defaultValue={this.props.gridCellSpacing()[1]}
                onChange={this.props.setVCellSpacing}
              />
            </Form>
          </td>
          <td>
            <Form>
              <FormControl
                style={{ width: '50px' }}
                type="text"
                defaultValue={this.props.gridCellSpacing()[0]}
                onChange={this.props.setHCellSpacing}
              />
            </Form>
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
      <Draggable defaultPosition={{ x: 100, y: 100 }} cancel={"form"}>
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
                    V-Space
                  </th>
                  <th>
                    H-Space
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
