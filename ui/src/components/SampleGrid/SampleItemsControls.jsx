import React from 'react';
import { BsSquare, BsCheck2Square, BsDashSquare } from 'react-icons/bs';
import { Button } from 'react-bootstrap';
import TooltipTrigger from '../TooltipTrigger';
export default function SampleItemsControls({
  sampleListFiltered,
  puck,
  OnClickHandler,
}) {
  let icon = <BsSquare size="0.9em" />;
  let pickSample = true;

  const allPuckSample = sampleListFiltered[0];
  const allPuckSampleCheck = sampleListFiltered[1];
  const puckCode = sampleListFiltered[2];

  if (allPuckSample.length === allPuckSampleCheck.length) {
    icon = <BsCheck2Square size="0.9em" />;
    pickSample = false;
  } else if (
    allPuckSample.length !== allPuckSampleCheck.length &&
    allPuckSampleCheck.length > 0
  ) {
    icon = <BsDashSquare size="0.9em" />;
    pickSample = false;
  }

  return (
    <>
      {puck && <span className="span-container-code"> {puckCode} </span>}
      <TooltipTrigger
        id="pick-sample-tooltip"
        placement="auto"
        tooltipContent={
          pickSample
            ? 'Pick samples/ Add to Queue'
            : 'Unpick samples / Remove from Queue'
        }
      >
        <Button
          variant="link"
          className="pick-puck-checkbox-button"
          onClick={(e) => OnClickHandler(e, allPuckSample, pickSample)}
        >
          <i>{icon}</i>
        </Button>
      </TooltipTrigger>
    </>
  );
}
