import { BsInfoCircleFill } from 'react-icons/bs';

import TooltipTrigger from '../TooltipTrigger';
import styles from './CustomFieldTemplate.module.css';

/**
 * @typedef {Object} CustomFieldTemplateProps
 * @property {string} id
 * @property {Object} schema - The JSON schema for the field.
 * @property {string} classNames - CSS classes passed to the field from RJSF.
 * @property {Object} uiSchema - The UI schema for the field.
 * @property {string} label - The label for the field.
 * @property {string} rawDescription - The description for the field (from the UI Schema)
 * @property {React.ReactNode} children - Contains the field input element.
 * @property {React.ReactNode} errors - Contains any validation errors. (<ul> tag)
 * @property {React.ReactNode} help - Contains help text for the field (from UI Schema).
 * @property {boolean} required - Indicates if the field is required.
 */

/**
 * CustomFieldTemplate is a custom field template for React JSON Schema Form (RJSF).
 * It is used to render fields with a specific layout and styling.
 * @param {CustomFieldTemplateProps} props
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

  return (
    <div className={`${gridClass} ${classNames}`.trim()}>
      <div className={styles.fieldTitle}>
        {label && (
          <label htmlFor={id} className={styles.fieldLabel}>
            {label}
            {required && <span className="text-danger">*</span>}
          </label>
        )}
        {rawDescription && (
          <TooltipTrigger
            tooltipContent={rawDescription}
            id={`${id}_tooltip`}
            inModal
          >
            <span>
              <BsInfoCircleFill />
            </span>
          </TooltipTrigger>
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
