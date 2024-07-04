# YAML configuration migration

Historically MXCuBE used XML files for configuring hardware objects.
Now it's possible to use YAML files instead of XML files.
To help with migration to YAML files, MXCuBE-Web can export loaded hardware objects configurations as YAML files.

Use `--export-yaml-config` argument when starting MXCuBE-web to enable YAML export.
For example, if you use:

```
    $ mxcubeweb-server --export-yaml-config <my-yaml-dir>
```

`mxcubeweb-server` will load your hardware object configuration as normal.
Then it will write the loaded configuration into the `<my-yaml-dir>`.
