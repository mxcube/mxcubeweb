# Login


## Sessions

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

## Authentication base

There are two types of authentication:

* __user-based__ which requiers username and a password. After succesfull login the user is requested by SelectProposal modal to choose one of the proposals it has assigned. Multiple users are allowed but with different control privileges:
  * First user gets control privileges,
  * subsequent users became observers,
  * if user logs in from another session, the previous one is logged out.

* __proposal-based__ where user logs in directly with proposal ID and password. No proposal selection is needed. Similarly to user-based login:
  * first user gains control prvilages,
  * the subseqent ones become observers whether they belong to the same proposal or not
  * TODO what should happen with the session?

The login type is configured in corresponding lims configuration file (e.g. [lims.xml](../../../demo/lims.xml) as for mxcube demo). In practice, it is determined by facilities depending on thier needs.
