import { BsInfoCircleFill } from 'react-icons/bs';

import TooltipTrigger from '../../../TooltipTrigger';

/**
 * @typedef
 * {Object} FieldDescriptionTooltipProps
 * @property {string} description - The description text to display in the tooltip.
 */

/**
 * FieldDescriptionTooltip is a component that displays a tooltip
 * with a description when hovering over an info icon.
 * @param {FieldDescriptionTooltipProps} props
 */
export function FieldDescriptionTooltip({ description }) {
  return (
    <TooltipTrigger
      tooltipContent={description}
      id={`${description}_tooltip`}
      inModal
    >
      <span>
        <BsInfoCircleFill />
      </span>
    </TooltipTrigger>
  );
}
