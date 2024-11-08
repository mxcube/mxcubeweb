import React, { useState } from 'react';
import { Form, InputGroup, Alert, Button } from 'react-bootstrap';

import { Controller, useForm } from 'react-hook-form';

import logo from '../../img/mxcube_logo20.png';
import loader from '../../img/loader.gif';
import styles from './LoginForm.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { logIn, ssoLogIn } from '../../actions/login';

function LoginForm() {
  const dispatch = useDispatch();

  const showErrorPanel = useSelector((state) => state.general.showErrorPanel);
  const errorMessage = useSelector((state) => state.general.errorMessage);

  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit: makeOnSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { username: '', password: '' } });

  const useSSO = useSelector((state) => state.login.useSSO);

  async function handleSubmit(data) {
    setLoading(true);
    try {
      await dispatch(logIn(data.username.toLowerCase(), data.password));
    } finally {
      setLoading(false);
    }
  }

  async function handleSingleSignOn() {
    await dispatch(ssoLogIn());
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
        {!useSSO && [
          <Form.Group className="mb-3" key="username">
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
          </Form.Group>,
          <Form.Group className="mb-3" key="password">
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
          </Form.Group>,
        ]}
        {useSSO ? (
          <Button onClick={handleSingleSignOn} size="lg" className={styles.btn}>
            {loading && (
              <img className={styles.loader} src={loader} width="25" alt="" />
            )}
            Sign in with SSO
          </Button>
        ) : (
          <Button type="submit" size="lg" className={styles.btn}>
            {loading && (
              <img className={styles.loader} src={loader} width="25" alt="" />
            )}
            Sign in with proposal
          </Button>
        )}
        {!loading && showErrorPanel && (
          <Alert className="mt-3" variant="danger">
            <pre className={styles.errorMsg}>{errorMessage}</pre>
          </Alert>
        )}
      </fieldset>
    </Form>
  );
}

export default LoginForm;
