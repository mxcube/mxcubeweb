import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

function TooltipTrigger(props) {
  const { id, placement = 'bottom', tooltipContent, children } = props;

  return (
    <OverlayTrigger
      rootClose // ensures focus is removed from child (and tooltip closed) when clicking anywhere else
      placement={placement}
      overlay={<Tooltip id={id}>{tooltipContent}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  );
}

export default TooltipTrigger;
