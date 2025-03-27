import React from 'react';

const TableBody = ({
  cell,
  cellID,
  puckList,
  isSingleCell,
  getSampleItems,
}) => {
  return (
    <tr>
      {puckList.map((puck) => {
        const puckidx = cell.children.findIndex((p) => p.name === puck.name);
        const puckID = isSingleCell ? Number(puck.name) : puckidx + 1;
        return (
          <td
            key={`${cellID}-td-${puckID}`}
            className={`sample-items-table-column-body custom-table-border-${puckID}`}
          >
            {getSampleItems(cellID, puckID, isSingleCell)}
          </td>
        );
      })}
    </tr>
  );
};

export default TableBody;
