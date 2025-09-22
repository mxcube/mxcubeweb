import { useEffect } from 'react';
import { Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { filterAction } from '../../actions/sampleGrid';
import styles from '../../containers/SampleFlexView.module.css';

const CELL_ID = 1;

export default function SampleCircleView(props) {
  const { displayPuckCellContextMenu, puckMenuID, type = 'Mockup' } = props;

  const filterOptions = useSelector((state) => state.sampleGrid.filterOptions);

  const pucks = useSelector((state) => state.sampleChanger.contents.children);

  const dispatch = useDispatch();

  function handleClickOnPuck(event, puckID) {
    dispatch(
      filterAction({ cellFilter: `${CELL_ID}`, puckFilter: `${puckID}` }),
    );
    event.stopPropagation();
  }

  useEffect(() => {
    if (filterOptions.cellFilter === '') {
      dispatch(filterAction({ cellFilter: '1', puckFilter: '1' }));
    }
  }, [filterOptions.cellFilter, dispatch]);

  function handleDisplayPuckCellContextMenu(e, menuID, puckID) {
    e.preventDefault();
    handleClickOnPuck(e, puckID === null ? '' : puckID);
    displayPuckCellContextMenu(e, menuID, CELL_ID, puckID);
    e.stopPropagation();
  }

  function getSingleCellAsCircle(centerX, centerY) {
    const totalPucks = pucks.length;

    // Adjust angle range based on puck count
    const useFullCircle = totalPucks >= 8;
    const angleRange = useFullCircle ? 2 * Math.PI : Math.PI * 1.5;
    const startAngle = useFullCircle ? 0 : (Math.PI - angleRange) / 2;

    // Circle size and spacing
    const baseRadius = 4;
    const placementRadius = baseRadius + Math.max(0, (totalPucks - 16) * 0.3);
    const puckRadius = Math.min(
      0.7,
      (2 * Math.PI * placementRadius) / (totalPucks * 2),
    );

    // Fix angle spacing: avoid skipping puck 1 or overlapping at end
    const angleDivisor = useFullCircle
      ? totalPucks
      : Math.max(1, totalPucks - 1);

    return pucks.map((_, i) => {
      const angle = startAngle + (angleRange * i) / angleDivisor;
      const x = centerX + placementRadius * Math.cos(angle);
      const y = centerY + placementRadius * Math.sin(angle);
      const puckID = i + 1;

      const isPuckSelected =
        Number(filterOptions.cellFilter) === CELL_ID &&
        Number(filterOptions.puckFilter) === puckID;

      return (
        <g
          key={`single_cell_puck_${puckID}`}
          onClick={(e) => handleClickOnPuck(e, puckID)}
          onContextMenu={(e) =>
            handleDisplayPuckCellContextMenu(e, puckMenuID, puckID)
          }
          fill={isPuckSelected ? '#015f9d' : '#cdced1'}
          className={styles.puckCicle}
        >
          <circle
            cx={x}
            cy={y}
            r={puckRadius}
            stroke="#01011ba2"
            strokeWidth="0.05"
          />
          <text
            x={x}
            y={y}
            fontSize="0.3"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isPuckSelected ? 'white' : 'black'}
          >
            Puck {puckID}
          </text>
          <title>
            Cell: {CELL_ID}, Puck: {puckID}
          </title>
        </g>
      );
    });
  }

  return (
    <Col sm={6}>
      <div className={styles.divSvgFlex}>
        <svg height="100%" width="100%" viewBox="0 1 20 20">
          <circle fill="#6cb0f5" r="8" cx="10" cy="10" />
          {getSingleCellAsCircle(10, 10)}
          <text x="10" y="10" fontSize="0.5" textAnchor="middle" fill="black">
            {type}
          </text>
        </svg>
      </div>
    </Col>
  );
}
