import { useEffect } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { updateNickname } from '../../actions/remoteAccess';

function ObserverDialog() {
  const dispatch = useDispatch();

  const { loginType, loginID, user } = useSelector((state) => state.login);
  const isUserLogin = loginType === 'User';
  const showDialog = !user.inControl && !user.nickname;

  const {
    register,
    handleSubmit: makeOnSubmit,
    setFocus,
  } = useForm({
    defaultValues: { name: loginID },
  });

  function handleSubmit(data) {
    dispatch(updateNickname(data.name || user.username));
  }

  useEffect(() => {
    if (showDialog) {
      setFocus('name');
    }
  }, [setFocus, showDialog]);

  return (
    <Modal
      backdrop="static"
      show={showDialog}
      style={{ zIndex: 10_001 }}
      data-default-styles
    >
      <Form onSubmit={makeOnSubmit(handleSubmit)}>
        <Modal.Header>
          <Modal.Title>Observer mode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Someone else is currently using the beamline, you are going to be
            logged in as an observer.
          </p>
          {!isUserLogin && (
            <Form.Group className="mt-3" controlId="observerName">
              <Form.Label>Please enter your name:</Form.Label>
              <Form.Control {...register('name')} type="text" />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit">Continue</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ObserverDialog;
