import React from 'react';
import { Table } from 'react-bootstrap';
import SampleGridTableHeader from './SampleGridTableHeader';
import SampleGridTableBody from './SampleGridTableBody';

export default function SampleGridTable({
  cell,
  cellID,
  puckList,
  isSingleCell,
  sampleListFiltered,
  itemsControlsClickHandler,
  displayContextMenuHandler,
  sampleItems,
}) {
  return (
    <Table bordered responsive size="sm" className="sample-items-table">
      <thead>
        <SampleGridTableHeader
          cell={cell}
          cellID={cellID}
          puckList={puckList}
          isSingleCell={isSingleCell}
          sampleListFiltered={sampleListFiltered}
          itemsControlsClickHandler={itemsControlsClickHandler}
          displayContextMenuHandler={displayContextMenuHandler}
        />
      </thead>
      <tbody>
        <SampleGridTableBody
          cell={cell}
          cellID={cellID}
          puckList={puckList}
          isSingleCell={isSingleCell}
          itemsControlsClickHandler={itemsControlsClickHandler}
          displayContextMenuHandler={displayContextMenuHandler}
          getSampleItems={sampleItems}
        />
      </tbody>
    </Table>
  );
}
