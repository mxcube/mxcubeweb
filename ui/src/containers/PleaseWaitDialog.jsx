import React from 'react';
import { Modal, ProgressBar, Button } from 'react-bootstrap';
import { setLoading } from '../actions/general';
import { useDispatch, useSelector } from 'react-redux';

function PleaseWaitDialog() {
  const dispatch = useDispatch();

  const loading = useSelector(({ general }) => general.loading);
  const title = useSelector(({ general }) => general.title);
  const message = useSelector(({ general }) => general.message);
  const blocking = useSelector(({ general }) => general.blocking);
  const abortFun = useSelector(({ general }) => general.abortFun);

  return (
    <Modal
      keyboard={!blocking}
      backdrop={!blocking || 'static'}
      show={loading}
      onHide={() => dispatch(setLoading(false))}
      data-default-styles
    >
      <Modal.Header closeButton={!blocking}>
        <Modal.Title>{title || 'Please wait'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <p>{message || ''}</p>
          {blocking && <ProgressBar variant="primary" animated now={100} />}
        </div>
      </Modal.Body>
      <Modal.Footer>
        {blocking ? (
          <Button
            variant="outline-secondary"
            onClick={() => {
              if (abortFun) {
                abortFun();
              }

              dispatch(setLoading(false));
            }}
          >
            Cancel
          </Button>
        ) : (
          <Button
            variant="outline-secondary"
            onClick={() => dispatch(setLoading(false))}
          >
            Hide
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default PleaseWaitDialog;
