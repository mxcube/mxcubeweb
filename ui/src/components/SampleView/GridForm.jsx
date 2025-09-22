/* eslint-disable jsx-a11y/control-has-associated-label */
import { useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { useSelector } from 'react-redux';

import TooltipTrigger from '../TooltipTrigger';
import styles from './GridForm.module.css';

function handleContextMenu(e) {
  e.stopPropagation();
}
/**
 * Returns the tooltip content for the hide button
 *
 * @param {boolean} userHidden - if the grid is hidden by the user
 * @param {boolean} autoHidden - if the grid is hidden automatically (out of view)
 * @returns {string} - the tooltip content
 */
function getHideButtonTooltip(userHidden, autoHidden) {
  if (userHidden) {
    return 'Grid is hidden by user';
  }
  if (autoHidden) {
    return 'Grid is out of view';
  }
  return 'Hide grid';
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
      const selected = selectedGrids.includes(grid.id);
      const userHidden = grid.userState === 'HIDDEN';
      const autoHidden = grid.state === 'HIDDEN' && !userHidden;
      gridControlList.push(
        <tr
          data-selected={selected}
          data-user-hidden={userHidden}
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
            <TooltipTrigger
              id={`grid-${grid.id}-visibility`}
              tooltipContent={getHideButtonTooltip(userHidden, autoHidden)}
            >
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
            </TooltipTrigger>
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
      onDrag={(_e, data) => setPosition({ x: data.x, y: data.y })}
      cancel="form"
    >
      <Row className={styles.gridForm} ref={draggableRef}>
        <Col xs={8}>
          <Table striped hover responsive className={styles.gridTable}>
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
