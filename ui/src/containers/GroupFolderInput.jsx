import { useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { setGroupFolder } from '../actions/queue';

function GroupFolderInput() {
  const dispatch = useDispatch();
  const groupFolder = useSelector((state) => state.queue.groupFolder);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      groupFolder: groupFolder || '',
    },
  });

  useEffect(() => {
    reset({ groupFolder: groupFolder || '' });
  }, [groupFolder, reset]);

  function onSubmit(data) {
    dispatch(setGroupFolder(data.groupFolder));
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="d-flex flex-column" controlId="group-folder-input">
        <Form.Label>Group path :</Form.Label>
        <div className="d-flex">
          <Form.Control
            size="sm"
            {...register('groupFolder')}
            style={{
              marginRight: '0.5rem',
              borderColor: isDirty ? '#ffc107' : undefined,
              boxShadow: isDirty
                ? '0 0 0 0.2rem rgba(255,193,7,.25)'
                : undefined,
            }}
          />
          <Button variant="outline-secondary" size="sm" type="submit">
            Set
          </Button>
        </div>
      </Form.Group>
    </Form>
  );
}

export default GroupFolderInput;
