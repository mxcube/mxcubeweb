/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { Row, Col, Form, Button, Table } from 'react-bootstrap';
import Draggable from 'react-draggable';

import './SampleView.css';
import { useSelector } from 'react-redux';

function handleContextMenu(e) {
  e.stopPropagation();
}

export default function GridForm(props) {
  const {
    getGridOverlayOpacity,
    gridList,
    removeGrid,
    rotateTo,
    saveGrid,
    selectedGrids,
    setHCellSpacing,
    setVCellSpacing,
    selectGrid,
    setGridOverlayOpacity,
    show,
    toggleVisibility,
  } = props;

  const draggableRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 64 });
  const { show_vspace, show_hspace } = useSelector((state) =>
    state.uiproperties.sample_view_video_controls.components.find(
      (component) => component.id === 'draw_grid',
    ),
  );

  // we want these buttons to have the same size. Additionally we want to assign them more space when there are additional controls shown.
  const addOrRemoveButtonSize = show_hspace || show_vspace ? '100%' : '75%';

  // we use the useEffect function with a ref here, since React's synthetic event
  // system (onContextMenu) could not stop the propagation
  // see  https://github.com/mxcube/mxcubeweb/pull/1397 for more details
  useEffect(() => {
    const draggableElement = draggableRef.current;
    if (draggableElement) {
      draggableElement.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      if (draggableElement) {
        draggableElement.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [show]);

  function getGridControls() {
    const gridControlList = [];

    for (const grid of Object.values(gridList)) {
      const vdim = grid.numRows * (grid.cellHeight + grid.cellVSpace);
      const hdim = grid.numCols * (grid.cellWidth + grid.cellHSpace);

      gridControlList.push(
        <tr
          data-selected={selectedGrids.includes(grid.id)}
          data-user-hidden={grid.userState === 'HIDDEN'}
          key={grid.name}
          onClick={(e) => selectGrid([grid], e.ctrlKey)}
        >
          <td>
            <span style={{ lineHeight: '24px' }}>{grid.name}</span>
          </td>
          {show_hspace ? <td>{grid.cellHSpace.toFixed(2)}</td> : null}
          {show_vspace ? <td>{grid.cellVSpace.toFixed(2)}</td> : null}
          <td>
            {vdim} x {hdim}
          </td>
          <td>{grid.numRows * grid.numCols}</td>
          <td>
            {grid.numRows}x{grid.numCols}
          </td>
          <td>{grid.motorPositions.phi.toFixed(2)}&deg;</td>
          <td>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={(e) => {
                e.stopPropagation();
                rotateTo(grid.id);
              }}
            >
              Rotate to
            </Button>
          </td>
          <td>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={(e) => {
                e.stopPropagation();
                toggleVisibility(grid.id);
              }}
            >
              {grid.state === 'HIDDEN' ? 'Show' : 'Hide '}
            </Button>
          </td>
          <td>
            <Button
              // we want these buttons to have the same size. Additionally we want to assign them more space when there are additional controls shown.
              style={{ width: addOrRemoveButtonSize }}
              variant="outline-secondary"
              onClick={(e) => {
                e.stopPropagation();
                removeGrid(grid.id);
              }}
            >
              -
            </Button>
          </td>
        </tr>,
      );
    }

    gridControlList.push(
      <tr key="current-grid">
        <td>
          <span style={{ lineHeight: '24px' }}>*</span>
        </td>
        {show_hspace && (
          <td>
            {/* prevents refresh when pressing enter */}
            <Form onSubmit={(event) => event.preventDefault()}>
              <Form.Control
                style={{ width: '50px' }}
                type="text"
                defaultValue={0}
                onChange={setHCellSpacing}
              />
            </Form>
          </td>
        )}
        {show_vspace && (
          <td>
            <Form onSubmit={(event) => event.preventDefault()}>
              <Form.Control
                style={{ width: '50px' }}
                type="text"
                defaultValue={0}
                onChange={setVCellSpacing}
              />
            </Form>
          </td>
        )}
        <td />
        <td />
        <td />
        <td />
        <td />
        <td />
        <td>
          <Button
            // we want these buttons to have the same size. Additionally we want to assign them more space when there are additional controls shown.
            style={{ width: addOrRemoveButtonSize }}
            variant="outline-secondary"
            onClick={() => saveGrid()}
          >
            +
          </Button>
        </td>
      </tr>,
    );

    return gridControlList;
  }

  if (!show) {
    return null;
  }

  return (
    <Draggable
      position={position}
      onDrag={(e, data) => setPosition({ x: data.x, y: data.y })}
      cancel="form"
    >
      <Row className="gridform" ref={draggableRef}>
        <Col xs={8}>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                {show_hspace && <th>H-Space (µm)</th>}
                {show_vspace && <th>V-Space (µm)</th>}
                <th>Dim (µm)</th>
                <th>#Cells</th>
                <th>R x C</th>
                <th>&Omega;</th>
                <th />
                <th />
                <th />
              </tr>
            </thead>
            <tbody>{getGridControls()}</tbody>
          </Table>
        </Col>
        <Col xs={4} style={{ marginTop: '20px' }}>
          <Form>
            <Form.Group className="mb-2" as={Row}>
              <Col sm="4">
                {' '}
                <Form.Label>Opacity</Form.Label>{' '}
              </Col>
              <Col sm="1"> : </Col>
              <Col sm="7">
                <Form.Control
                  style={{ width: '100px', padding: '0' }}
                  className="bar"
                  type="range"
                  id="overlay-control"
                  min="0"
                  max="1"
                  step="0.05"
                  defaultValue={getGridOverlayOpacity()}
                  onChange={setGridOverlayOpacity}
                  name="overlaySlider"
                />
              </Col>
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </Draggable>
  );
}
