import { OverlayTrigger, Tooltip } from 'react-bootstrap';

function TooltipTrigger(props) {
  const {
    id,
    rootClose = true,
    placement = 'bottom',
    tooltipContent,
    children,
    inModal = false,
  } = props;

  return (
    <OverlayTrigger
      rootClose={rootClose} // ensures whether focus is removed from child (and tooltip closed) when clicking anywhere else
      placement={placement}
      overlay={
        <Tooltip data-tooltip-in-modal={inModal} id={id}>
          {tooltipContent}
        </Tooltip>
      }
    >
      {children}
    </OverlayTrigger>
  );
}

export default TooltipTrigger;
