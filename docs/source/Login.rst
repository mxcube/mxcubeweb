Login
=====

MXCuBE web sessions are meant to expire when there is no activity,
as opposed to a typical web session that expires when the browser is closed.

For this purpose:

* Flask configuration setting ``PERMANENT_SESSION_LIFETIME`` is set
  to the preferred value (seconds).

* Flask configuration setting ``SESSION_REFRESH_EACH_REQUEST`` is set,
  which is the default anyway.

* Flask session setting ``session.permanent`` is set
  right after successful authentication.

* The front-end calls the ``/mxcube/api/v0.1/login/refresh_session`` endpoint
  regularly (hardcoded value: 9000 milliseconds)
  for as long as the browser tab is open.

Every time the *refresh* endpoint is called,
the browser session cookie is refreshed,
meaning its expiration timestamp is pushed back in the future
for as much as the value stored in ``PERMANENT_SESSION_LIFETIME``.


Login API
---------

.. autoflask:: mxcube3.routes.Login:mxcube
    :endpoints: login, signout, loginInfo, get_initial_state, proposal_samples
