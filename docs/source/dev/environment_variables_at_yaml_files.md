# Using environemtn variables at yaml files

mxcubeweb `ConfigLoader` class reads all content from server.yaml and ui.yaml, from your configuration files repository.
If a variable starts exactly with `_ENV_`, then instead of reading it, `ConfigLoader` will read that variable from the environment.

## Example usage

If server.yaml contains this content:

```
sso:
  USE_SSO: true
  META_DATA_URI: https://my_metadata_uri.cnpem.br
  LOGOUT_URI: https://my_logout_uri.cnpem.br
  CLIENT_ID: _ENV_CLIENT_ID
```

Then CLIENT_ID will be obtained via:

```
os.getenv("_ENV_CLIENT_ID")
```

The function that does this is located at `mxcubeweb/config.py`. It walks recursively through all of `ConfigLoader` content.
