import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Col } from 'react-bootstrap';
import { filterAction } from '../../actions/sampleGrid';

export default function SampleFlexView(props) {
  const {
    displayPuckCellContextMenu,
    cellMenuID,
    puckMenuID,
    type = 'FLEX HCD',
  } = props;
  const filterOptions = useSelector((state) => state.sampleGrid.filterOptions);
  const scContent = useSelector((state) => state.sampleChanger.contents);
  const [pendingEvent, setPendingEvent] = useState(null);

  const numberOfCell = scContent.children.length; // Number of cells/slices

  const dispatch = useDispatch();

  function handleClickonCellPuck(event, cell, puck) {
    dispatch(filterAction({ cellFilter: `${cell}`, puckFilter: `${puck}` }));
    event.stopPropagation();
  }

  function isCellSelected(cell) {
    return Number(filterOptions.cellFilter) === cell;
  }

  function isPuckSelected(cell, puck) {
    return (
      Number(filterOptions.cellFilter) === cell &&
      Number(filterOptions.puckFilter) === puck
    );
  }

  // Call displayPuckCellContextMenu only after Redux state updates
  useEffect(() => {
    if (pendingEvent) {
      displayPuckCellContextMenu(
        pendingEvent.event,
        pendingEvent.menuID,
        pendingEvent.cell,
        pendingEvent.puck,
      );
      setPendingEvent(null);
    }
  }, [filterOptions, pendingEvent, displayPuckCellContextMenu]);

  useEffect(() => {
    if (filterOptions.cellFilter === '') {
      dispatch(filterAction({ cellFilter: `${1}`, puckFilter: '' }));
    }
  }, [filterOptions.cellFilter, dispatch]);

  function handleDisplayPuckCellContextMenu(event, menuID, cell, puck) {
    handleClickonCellPuck(event, cell, puck === null ? '' : puck);
    setPendingEvent({ event, menuID, cell, puck });
    event.stopPropagation();
  }

  function getPieSlicePath(idxCell, radius = 8, centerX = 10, centerY = 10) {
    // Calculate start and end angles for each slice
    const angleStart = (idxCell * 360) / numberOfCell;
    const angleEnd = ((idxCell + 1) * 360) / numberOfCell;

    // Convert angles to radians
    const startX = centerX + radius * Math.cos((angleStart * Math.PI) / 180);
    const startY = centerY + radius * Math.sin((angleStart * Math.PI) / 180);
    const endX = centerX + radius * Math.cos((angleEnd * Math.PI) / 180);
    const endY = centerY + radius * Math.sin((angleEnd * Math.PI) / 180);

    // Create the pie slice path (triangle shape)
    return `M${centerX},${centerY} L${startX},${startY} A${radius},${radius} 0 0,1 ${endX},${endY} Z`;
  }

  function getCirclesInSlice(idxCell, centerX = 10, centerY = 10) {
    // numberOfPuck: Number of pucks/circles inside each slice/Cell
    const numberOfPuck = scContent.children[idxCell].children.length;

    const angle = ((idxCell + 0.5) * 360) / numberOfCell; // Middle of the slice
    const angleRad = (angle * Math.PI) / 180; // Convert angles to radians

    const baseRadius = 3.5; // Inner spacing
    const rowSpacing = 3; // Distance between rows

    const positions = [];

    const cell = idxCell + 1;

    if (numberOfPuck === 1) {
      positions.push({
        x: centerX + baseRadius * Math.cos(angleRad),
        y: centerY + baseRadius * Math.sin(angleRad),
      });
    } else if (numberOfPuck === 2) {
      positions.push(
        {
          x: centerX + baseRadius * Math.cos(angleRad),
          y: centerY + baseRadius * Math.sin(angleRad),
        },
        {
          x: centerX + (baseRadius + rowSpacing) * Math.cos(angleRad),
          y: centerY + (baseRadius + rowSpacing) * Math.sin(angleRad),
        },
      );
    } else if (numberOfPuck >= 3) {
      // Dynamic Triangle Grid Formation
      for (let row = 0; row < Math.ceil(numberOfPuck / 2); row++) {
        const numCols = row + 1; // First row from center has 1, second has 2, etc.
        const rowOffset = rowSpacing * row;

        for (
          let col = 0;
          col < numCols && positions.length < numberOfPuck;
          col++
        ) {
          const colOffset = (col - (numCols - 1) / 2) * rowSpacing * 0.8;
          positions.push({
            x:
              centerX +
              (baseRadius + rowOffset) * Math.cos(angleRad) +
              colOffset * Math.sin(angleRad),
            y:
              centerY +
              (baseRadius + rowOffset) * Math.sin(angleRad) -
              colOffset * Math.cos(angleRad),
          });
        }
      }
    }

    return positions.map((pos, idxPuck) => {
      const puck = idxPuck + 1;

      return (
        <g
          key={`puck_circle${puck}`}
          onClick={(e) => handleClickonCellPuck(e, cell, puck)}
          onContextMenu={(e) =>
            handleDisplayPuckCellContextMenu(e, puckMenuID, cell, puck)
          }
          fill={isPuckSelected(cell, puck) ? '#015f9d' : '#cdced1'}
          className="puck_cicle"
        >
          <circle
            key={`circle_${pos.x}_${pos.y}`}
            cx={pos.x}
            cy={pos.y}
            r="0.7"
            fill={isPuckSelected(cell, puck) ? '#015f9d' : '#cdced1'}
            stroke="#01011ba2"
            strokeWidth="0.05"
            className="_cicle"
          />
          <text
            x={pos.x}
            y={pos.y}
            fontSize="0.3"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isPuckSelected(cell, puck) ? 'white' : 'black'}
            className="text_puck_cicle"
          >
            Puck {puck}
          </text>
          <title>
            Cell: {cell}, Puck : {puck}
          </title>
        </g>
      );
    });
  }

  function getTextPosition(idxCell, radius = 5, centerX = 10, centerY = 10) {
    // Calculate middle angle of the slice
    const angle = ((idxCell + 0.5) * 360) / numberOfCell;
    const angleRad = (angle * Math.PI) / 180;

    // Position text at the center of the pie slice
    const textX = centerX + radius * Math.cos(angleRad);
    const textY = centerY + radius * Math.sin(angleRad);

    return { x: textX, y: textY };
  }

  function getCellSlice(idxCell) {
    const cell = idxCell + 1;
    const color = isCellSelected(cell) ? '#6cb0f5' : '#cdced1';
    const { x, y } = getTextPosition(idxCell);

    return (
      <g
        key={`Pie_${idxCell}`}
        onClick={(e) => handleClickonCellPuck(e, cell, '')}
        onContextMenu={(e) =>
          handleDisplayPuckCellContextMenu(e, cellMenuID, cell, null)
        }
        style={{ transition: 'fill 0.3s ease' }} // Smooth transition effect
      >
        {/* Pie Slice */}
        <path
          d={getPieSlicePath(idxCell)}
          fill={color}
          stroke="white"
          strokeWidth="0.12"
          className="cell-cicle"
          style={{ transition: 'fill 0.3s ease' }} // Smooth transition effect
        />
        {/* Circles Inside the Slice (Triangle Grid) */}
        {getCirclesInSlice(idxCell)}
        <text
          x={x}
          y={y}
          fontSize="0.2"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="black"
          className="cell-cicle"
        >
          Cell {cell}
        </text>
        <title>Cell {cell}</title>
      </g>
    );
  }

  return (
    <Col sm={6}>
      <div className="div-svg-flex">
        {/* <svg className="svg-flex" height="97%" width="97%" viewBox="0 1 20 20"> */}
        <svg className="svg-flex" height="97%" width="97%" viewBox="0 1 18 18">
          {Array.from({ length: numberOfCell }, (_, idx) => getCellSlice(idx))}
          <circle fill="#6cb0f5" r="2" cx="10" cy="10" />
          <text x="10" y="10" fontSize="0.5" textAnchor="middle" fill="black">
            {type}
          </text>
        </svg>
      </div>
    </Col>
  );
}
