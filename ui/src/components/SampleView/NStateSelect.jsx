import { Form } from 'react-bootstrap';

import TooltipTrigger from '../TooltipTrigger';
import styles from './NStateSelect.module.css';

/**
 * Select-type input for hardware objects with discrete states, e.g.
 * ones accessed with NStateAdapter.
 *
 * @typedef {Object} Props
 * @property {string} id - DOM id for the select element.
 * @property {string} value - Currently selected value.
 * @property {string[]} options - Selectable values shown in the dropdown.
 * @property {boolean} isBusy - Whether the hardware is busy.
 * @property {(value: string) => void} onSelect - Called with the new value on user change.
 * @property {string?} tooltip - Hover tooltip text.
 * @property {string[]?} readOnlyOptions - Values that may be reported by the
 *   hardware but are not user-selectable.
 *
 * @param {Props} props
 */
export function NStateSelect({
  id,
  value,
  options,
  isBusy,
  onSelect,
  tooltip,
  readOnlyOptions = [],
}) {
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
