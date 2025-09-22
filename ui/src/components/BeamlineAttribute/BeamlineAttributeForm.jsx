import { useEffect } from 'react';
import { Button, ButtonToolbar, Form } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { TiTick, TiTimes } from 'react-icons/ti';

import styles from './BeamlineAttribute.module.css';

function BeamlineAttributeForm(props) {
  const { value, isBusy, step, precision, limits, onSave, onCancel } = props;

  const {
    register,
    setFocus,
    setError,
    handleSubmit: makeOnSubmit,
    formState: { isDirty, errors },
  } = useForm({ defaultValues: { value: value.toFixed(precision) } });

  useEffect(() => {
    if (!isBusy) {
      setTimeout(() => {
        /* Focus and select text when popover opens and every time a value is applied.
         * Timeout ensures this works when opening a popover while another is already opened. */
        setFocus('value', { shouldSelect: true });
      }, 0);
    }
  }, [isBusy, setFocus]);

  async function handleSubmit(data) {
    try {
      await onSave(data.value);
    } catch {
      setError('value', { message: 'Unable to set value' });
    }
  }

  const minMaxMsg = `Allowed range: [${limits
    .map((v) => v.toFixed(precision))
    .join(', ')}]`;

  return (
    <Form noValidate onSubmit={makeOnSubmit(handleSubmit)}>
      <div className="d-flex">
        <Form.Control
          {...register('value', {
            valueAsNumber: true,
            required: 'Please enter a valid number',
            min: { value: limits[0], message: minMaxMsg },
            max: { value: limits[1], message: minMaxMsg },
            disabled: isBusy,
          })}
          className={styles.input}
          type="number"
          step={step}
          aria-label="Value"
          isInvalid={isDirty && !!errors.value}
        />
        <ButtonToolbar className="ms-1">
          {isBusy ? (
            <Button variant="danger" size="sm" onClick={() => onCancel()}>
              <TiTimes size="1.5em" />
            </Button>
          ) : (
            <Button type="submit" variant="success" size="sm">
              <TiTick size="1.5em" />
            </Button>
          )}
        </ButtonToolbar>
      </div>
      {errors.value && <p className={styles.error}>{errors.value.message}</p>}
    </Form>
  );
}

export default BeamlineAttributeForm;
