# Login

## Authentication and authorization

The authentication and authorization of a user have traditionally been performed
in one step via the `ISPYBClient` hardware object. The authentication step has
either been done through LDAP or delegated to ISPyB. `ISPYBClient` has been
replaced by `ISPyBAbstractLIMS` and exists in two variants, one for user-based
login (`UserTypeISPyBLims`) and another one for proposal
(`ProposalTypeISPyBLims`) both of which support authentication via LDAP or
ISPyB. The possibility to authenticate via LIMS will be removed in the future,
and authentication has to be delegated to a process dedicated to authentication.
The authorization for a user to use a beamline is performed via the user portal
or LIMS system.

### Authentication with single sign-on

MXCUBE can be configured to use single sign-on (SSO) through OpenIDConnect for
user authentication. The OpenIDConnect configuration is located in the
`server.yaml` file, which should contain an `sso` section like the one below:

```
sso:
  USE_SSO: false                                              # `true` to use SSO
  ISSUER: https://websso.[site].[com]/realms/[site]/          # OpenIDConnect issuer URI
  LOGOUT_URI: ""                                              # OpenIDConnect logout URI
  TOKEN_INFO_URI: ""                                          # OpenIDConnect token info URI
  CLIENT_SECRET: ASECRETKEY                                   # OpenIDConnect client secret
  CLIENT_ID: mxcube                                           # OpenIDConnect client ID
  SCOPE: openid email profile                                 # OpenIDConnect default scopes, none scope is actually being used
  CODE_CHALLANGE_METHOD: S256                                 # OpenIDConnect challange method
```

User authorization is delegated to the LIMS client inheriting `AbstractLims` and is performed in the `login` method.

## HTTP session management

MXCuBE web sessions are meant to expire when there is no activity.

For this purpose:

- Flask configuration setting `PERMANENT_SESSION_LIFETIME` is set
  to the preferred value (seconds).

- Flask configuration setting `SESSION_REFRESH_EACH_REQUEST` is enabled,
  which is the default anyway.

- Flask session setting `session.permanent` is set
  right after successful authentication.

- The front-end calls the `/mxcube/api/v0.1/login/refresh_session` endpoint
  regularly (interval is specified in [`server.yaml`](../config/server.rst#session-refresh-interval), default to 9000 milliseconds )
  for as long as the browser tab is open.

Every time the _refresh_ endpoint is called,
the browser session cookie is refreshed,
meaning its expiration timestamp is pushed back in the future
for as much as the value stored in `PERMANENT_SESSION_LIFETIME`.

### Testing with ISPyBMockupClient

`ISPyBMockupClient` simulates both user type and proposal type login. The
typical demo/test configuration can be found below. The `loginType` attribute
is used to switch between the two different behaviours, `user` for user type
login and `proposal` for proposal type login.

```
<object class="ISPyBClientMockup">
  <object hwrid="/lims_rest" role="lims_rest"/>
  <ws_root>
    https://your.lims.org
  </ws_root>
  <base_result_url>
    https://your.limsresults.org
  </base_result_url>
  <ws_username></ws_username>
  <ws_password></ws_password>
  <loginType>user</loginType>                <!-- set to user or proposal -->
  <object role="session" href="/session"/>
</object>
```

_Example test configuration_
