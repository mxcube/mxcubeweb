import React from 'react';
import { BiMenu } from 'react-icons/bi';
import { PUCK_MENU_ID } from './utils';

import SampleItemsControls from './SampleItemsControls';

export default function SampleGridTableHeader({
  cell,
  cellID,
  puckList,
  isSingleCell,
  sampleListFiltered,
  itemsControlsClickHandler,
  displayContextMenuHandler,
}) {
  return (
    <tr>
      {puckList.map((puck) => {
        const puckidx = cell.children.findIndex((p) => p.name === puck.name);
        const puckID = isSingleCell ? Number(puck.name) : puckidx + 1;

        const sampleList = sampleListFiltered(cellID, puckID);

        return (
          <th
            key={`${cellID}-th-${puckID}`}
            className="sample-items-table-row-header-th"
          >
            <span className="puck-label">Puck {puckID}</span>
            <span className="puck-controls">
              {/* {renderItemsControls(cellID, puckID)} */}
              <SampleItemsControls
                sampleListFiltered={sampleList}
                puck={null}
                OnClickHandler={itemsControlsClickHandler}
              />
            </span>
            <span
              className="samples-grid-table-context-menu-icon"
              title="Puck Options"
              onClick={(e) =>
                displayContextMenuHandler(e, PUCK_MENU_ID, cellID, puckID)
              }
            >
              <BiMenu size="1.5em" />
            </span>
          </th>
        );
      })}
    </tr>
  );
}
