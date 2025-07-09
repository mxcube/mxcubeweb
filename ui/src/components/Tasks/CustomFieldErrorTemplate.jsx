import { BsExclamationTriangle } from 'react-icons/bs';

import styles from './CustomFieldErrorTemplate.module.css';

/**
 *
 * @param {import('@rjsf/utils').FieldErrorProps} props
 * @returns
 */
export default function CustomFieldErrorTemplate(props) {
  const { errors = [] } = props;
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={styles.fieldErrorContainer}>
      {errors.map((error) => (
        <div key={error} className={styles.errorMessage}>
          <BsExclamationTriangle className={styles.errorIcon} />
          {error}
        </div>
      ))}
    </div>
  );
}
