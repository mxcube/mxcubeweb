import { Dropdown } from 'react-bootstrap';
import {
  BsCheck,
  BsExclamationCircle,
  BsExclamationTriangle,
  BsInfoCircle,
} from 'react-icons/bs';

import TooltipTrigger from '../TooltipTrigger';
import styles from './NStateSelect.module.css';

const SEVERITY_CLASSES = {
  danger: styles.danger,
  info: styles.info,
  warning: styles.warning,
} as const;

const SEVERITY_ICONS = {
  danger: BsExclamationCircle,
  info: BsInfoCircle,
  warning: BsExclamationTriangle,
} as const;

interface NStateOption {
  value: string;
  label?: string | null;
  description?: string | null;
  severity?: keyof typeof SEVERITY_CLASSES | null;
}

function normalizeOption(option: string | NStateOption): NStateOption {
  return typeof option === 'string' ? { value: option } : option;
}

interface NStateSelectProps {
  id: string; // DOM id for the select element.
  value: string; // currently selected value
  options: (string | NStateOption)[]; // selectable values shown in the dropdowwn.
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
        {normalizedOptions.map((option) => {
          const Icon = option.severity && SEVERITY_ICONS[option.severity];
          return (
            <TooltipTrigger
              key={option.value}
              id={`${id}-${option.value}-tooltip`}
              placement="right"
              tooltipContent={option.description}
            >
              <Dropdown.Item
                eventKey={option.value}
                active={option.value === value}
                className={styles.item}
              >
                <span
                  className={`${styles.icon} ${
                    option.severity ? SEVERITY_CLASSES[option.severity] : ''
                  }`}
                >
                  {Icon && <Icon aria-hidden />}
                </span>
                <span className={styles.label}>
                  {option.label ?? option.value}
                </span>
                {option.value === value && <BsCheck aria-hidden />}
              </Dropdown.Item>
            </TooltipTrigger>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}
