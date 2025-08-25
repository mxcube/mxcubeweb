import styles from './CustomFieldTemplate.module.css';
import { FieldDescriptionTooltip } from './Widgets/FieldDescriptionTooltip/FieldDescriptionTooltip';

/**
 * CustomFieldTemplate is a custom field template for React JSON Schema Form (RJSF).
 * It is used to render fields with a specific layout and styling.
 * @param {import('@rjsf/utils').FieldTemplateProps} props
 * @return {JSX.Element} The rendered custom field template.
 */
export default function CustomFieldTemplate(props) {
  const {
    id,
    schema,
    classNames,
    uiSchema = {},
    label,
    rawDescription,
    children,
    errors,
    help,
    required,
  } = props;

  if (schema.type === 'object') {
    return <div className={classNames}>{children}</div>;
  }

  const span = Number(uiSchema['ui:options']?.col) || 6;
  const gridClass = `col-${span}`;
  const fieldClassNames = `${gridClass} ${classNames}`.trim();

  if (schema.type === 'boolean') {
    return (
      <div className={fieldClassNames}>
        {/*
         * RJSF renders the checkbox with label and description by default
         * These will be provided be custom CheckboxWidget
         * In the same line as the checkbox input.
         */}
        {children}
      </div>
    );
  }

  return (
    <div className={fieldClassNames}>
      <div className={styles.fieldTitle}>
        {label && (
          <label htmlFor={id} className={styles.fieldLabel}>
            {label}
            {required && <span className="text-danger">*</span>}
          </label>
        )}
        {rawDescription && (
          <FieldDescriptionTooltip description={rawDescription} />
        )}
      </div>
      <div className={styles.fieldInput}>
        {children}
        <small className={styles.fieldHelp}>{help}</small>
      </div>
      <div className={styles.fieldError}>{errors}</div>
    </div>
  );
}
