import './SampleView.css';
import React from 'react';
import { Row, Col, Form, Button, Table } from 'react-bootstrap';
import Draggable from 'react-draggable';


export default class GridForm extends React.Component {
  constructor(props) {
    super(props);
    this.use_advanced_settings = false;
  }

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
          { this.use_advanced_settings ? [
            (<td>
              {grid.cellVSpace.toFixed(2)}
            </td>),
            (<td>
              {grid.cellHSpace.toFixed(2)}
            </td>)] : null
          }
          <td>
            {vdim} x {hdim}
          </td>
          <td>
            {grid.numRows * grid.numCols}
          </td>
          <td>
            {grid.numRows}x{grid.numCols}
          </td>
          <td>
            { grid.motorPositions.phi.toFixed(2) }&deg;
          </td>
          <td>
            <Button
              size='sm'
              variant='outline-secondary'
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
              size='sm'
              variant='outline-secondary'
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
              size='sm'
              variant='outline-secondary'
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
          { this.use_advanced_settings ? [(
            <td>
              <Form>
                <Form.Control
                  style={{ width: '50px' }}
                  type="text"
                  defaultValue={0}
                  onChange={this.props.setVCellSpacing}
                />
              </Form>
            </td>),
          (<td>
              <Form>
                <Form.Control
                  style={{ width: '50px' }}
                  type="text"
                  defaultValue={0}
                  onChange={this.props.setHCellSpacing}
                />
              </Form>
            </td>)] : null
          }
          <td />
          <td />
          <td />
          <td />
          <td />
          <td />
          <td>
            <Button size='sm'variant='outline-secondary' onClick={() => this.props.saveGrid()}>
              +
            </Button>
          </td>
        </tr>));

    return gridControlList;
  }

  render() {
    const gridForm = (
      <Draggable defaultPosition={{ x: 20, y: 50 }} cancel="form">
        <Row className="gridform">
          <Col xs={8}>
            <Table
              striped
              hover
              responsive
            >
              <thead>
                <tr>
                  <th>
                    Name
                  </th>
                  { this.use_advanced_settings ? [(
                    <th>
                      V-Space (µm)
                    </th>),
                  (<th>
                      H-Space (µm)
                    </th>)] : null
                  }
                  <th>
                    Dim (µm)
                  </th>
                  <th>
                    #Cells
                  </th>
                  <th>
                    R x C
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
          </Col>
          <Col xs={4} style={{ marginTop: '20px' }}>
            <Form >
              <Form.Group className='mb-2' as={Row}>
                <Col sm="4"> <Form.Label >Opacity</Form.Label> </Col>
                <Col sm="1"> : </Col>
                <Col sm="7">
                  <Form.Control
                    style={{ width: '100px', padding: '0' }}
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
                </Col>
              </Form.Group>
              <Form.Group className='mb-2'  as={Row}>
                <Col sm="4"> <Form.Label >Heat map</Form.Label> </Col>
                <Col sm="1"> : </Col>
                <Col sm="7">
                  <Form.Check
                    name="resultType"
                    type="radio"
                    onClick={() => this.props.setGridResultType('heatmap')}
                    checked={this.props.gridResultType === 'heatmap'}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row}>
                <Col sm="4"> <Form.Label >Crystal map</Form.Label> </Col>
                <Col sm="1"> : </Col>
                <Col sm="7">
                  <Form.Check
                    name="resultType"
                    type="radio"
                    onClick={() => this.props.setGridResultType('crystalmap')}
                    checked={this.props.gridResultType === 'crystalmap'}
                  />
                </Col>
              </Form.Group>
            </Form>
          </Col>
        </Row>
      </Draggable>);

    return this.props.show ? gridForm : null;
  }
}

GridForm.defaultProps = {
  show: true
};
