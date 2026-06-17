import { Form } from 'react-bootstrap';

import TooltipTrigger from '../TooltipTrigger';
import styles from './NStateSelect.module.css';

interface NStateSelectProps {
  id: string; // DOM id for the select element.
  value: string; // currently selected value
  options: string[]; // selectable values shown in the dropdowwn.
  isBusy: boolean; // whether the hardware is busy
  onSelect: (value: string) => void; // called for the new value on select
  tooltip?: string; // hover tooltip text
  readOnlyOptions?: string[]; // values that may be reported, but not selectable.
}

export function NStateSelect({
  id,
  value,
  options,
  isBusy,
  onSelect,
  tooltip,
  readOnlyOptions = [],
}: NStateSelectProps) {
  return (
    <TooltipTrigger id={`${id}-tooltip`} tooltipContent={tooltip}>
      <Form.Select
        id={id}
        className={styles.select}
        value={value}
        data-busy={isBusy || undefined}
        disabled={isBusy}
        onChange={(evt) => onSelect(evt.target.value)}
      >
        {/* readOnlyOptions maybe shown as a value, but are not selectable. */}
        {readOnlyOptions.map((option) => (
          <option key={option} hidden>
            {option}
          </option>
        ))}
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </Form.Select>
    </TooltipTrigger>
  );
}
