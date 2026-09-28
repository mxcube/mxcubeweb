import { Dropdown } from 'react-bootstrap';

import TooltipTrigger from '../TooltipTrigger';
import styles from './NStateSelect.module.css';

const VARIANT_CLASSES = {
  danger: styles.danger,
  info: styles.info,
  warning: styles.warning,
} as const;

interface NStateOption {
  value: string;
  label?: string;
  description?: string;
  variant?: keyof typeof VARIANT_CLASSES;
}

function normalizeOption(option: string | NStateOption): NStateOption {
  return typeof option === 'string' ? { value: option } : option;
}

interface NStateSelectProps {
  id: string; // DOM id for the select element.
  value: string; // currently selected value
  options: string[]; // selectable values shown in the dropdowwn.
  isBusy: boolean; // whether the hardware is busy
  onSelect: (value: string) => void; // called for the new value on select
  tooltip?: string; // hover tooltip text
}

export function NStateSelect({
  id,
  value,
  options,
  isBusy,
  onSelect,
  tooltip,
}: NStateSelectProps) {
  const normalizedOptions = options.map(normalizeOption);

  const selected = normalizedOptions.find(
    (option) => option.value === value,
  ) ?? {
    value,
  };

  return (
    <Dropdown onSelect={(key) => key !== null && onSelect(key)}>
      <TooltipTrigger id={`${id}-tooltip`} tooltipContent={tooltip}>
        <Dropdown.Toggle
          id={id}
          variant="light"
          className={styles.select}
          data-state={isBusy ? 'busy' : 'ready'}
          disabled={isBusy}
        >
          {selected.label ?? selected.value}
        </Dropdown.Toggle>
      </TooltipTrigger>
      <Dropdown.Menu className={styles.menu}>
        {normalizedOptions.map((option) => (
          <Dropdown.Item
            key={option.value}
            eventKey={option.value}
            active={option.value === value}
            className={styles.item}
          >
            <div
              className={option.variant ? VARIANT_CLASSES[option.variant] : ''}
            >
              {option.label ?? option.value}
            </div>
            {option.description && (
              <div
                className={`${styles.description} ${
                  option.variant ? VARIANT_CLASSES[option.variant] : ''
                }`}
              >
                {option.description}
              </div>
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
