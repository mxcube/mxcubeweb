import { Form } from 'react-bootstrap';

import { FieldDescriptionTooltip } from '../FieldDescriptionTooltip/FieldDescriptionTooltip';
import styles from './CheckboxWidget.module.css';
/**
 * Checkbox widget for RJSF forms.
 *
 * It is used to display checkboxes with the description as a tooltip.
 * @param {import('@rjsf/utils').WidgetProps} props
 */
export default function CheckboxWidget({
  id,
  value,
  disabled,
  schema,
  label,
  required,
  readonly,
  onChange,
  onBlur,
  onFocus,
}) {
  const { description } = schema;

  return (
    <div className={styles.wrapper}>
      <Form.Check
        id={id}
        checked={Boolean(value)}
        disabled={disabled || readonly}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={(e) => onBlur(id, e.target.checked)}
        onFocus={(e) => onFocus(id, e.target.checked)}
      />
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      {description && <FieldDescriptionTooltip description={description} />}
    </div>
  );
}
