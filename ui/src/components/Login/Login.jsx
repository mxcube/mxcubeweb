import React from 'react';
import { Form, InputGroup, Alert, Button } from 'react-bootstrap';

import { Controller, useForm } from 'react-hook-form';

import logo from '../../img/mxcube_logo20.png';
import loader from '../../img/loader.gif';
import withRouter from '../WithRouter';
import styles from './Login.module.css';

function LoginComponent(props) {
  const { router, loading, logIn, showError, errorMessage } = props;

  const {
    control,
    handleSubmit: makeOnSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { username: '', password: '' } });

  async function handleSubmit(data) {
    await logIn(data.username.toLowerCase(), data.password, router.navigate);
  }

  return (
    <Form
      className={styles.box}
      noValidate
      onSubmit={makeOnSubmit(handleSubmit)}
    >
      <h1 className={styles.title}>
        <img src={logo} width="80" alt="" />
        MXCuBE
      </h1>
      <fieldset className={styles.fieldset} disabled={loading}>
        <Form.Group className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-user" />
            </InputGroup.Text>
            <Controller
              name="username"
              control={control}
              rules={{ required: 'Login ID is required' }}
              render={({ field }) => (
                <Form.Control
                  type="text"
                  aria-label="Login ID"
                  placeholder="Login ID"
                  autoFocus // eslint-disable-line jsx-a11y/no-autofocus
                  required
                  isInvalid={!!errors.username}
                  {...field}
                />
              )}
            />
            {errors.username && (
              <Form.Control.Feedback type="invalid">
                {errors.username.message}
              </Form.Control.Feedback>
            )}
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-lock" />
            </InputGroup.Text>
            <Controller
              name="password"
              control={control}
              rules={{ required: 'Password is required' }}
              render={({ field }) => (
                <Form.Control
                  type="password"
                  aria-label="Password"
                  placeholder="Password"
                  required
                  isInvalid={!!errors.password}
                  {...field}
                />
              )}
            />
            {errors.password && (
              <Form.Control.Feedback type="invalid">
                {errors.password.message}
              </Form.Control.Feedback>
            )}
          </InputGroup>
        </Form.Group>
        <Button type="submit" size="lg" className={styles.btn}>
          {loading && (
            <img className={styles.loader} src={loader} width="25" alt="" />
          )}
          Sign in
        </Button>
        {!loading && showError && (
          <Alert className="mt-3" variant="danger">
            <pre className={styles.errorMsg}>{errorMessage}</pre>
          </Alert>
        )}
      </fieldset>
    </Form>
  );
}

export default withRouter(LoginComponent);
