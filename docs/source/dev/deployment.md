# Deployment

Some aspects to pay attention to
when considering the deployment of {{ project }} into a production environment.

## Python backend part of the web application

The Python backend part of {{ project }}
uses [*Poetry*](https://python-poetry.org/) as development workflow tool.
One of Poetry's features is support for a so-called *lockfile*.
Poetry's lockfile is the `poetry.lock` file
one can see at the root of the source code tree of {{ project }}.

This lockfile helps create repeatable installations.
By taking advantage of Poetry's lockfile
it should be possible to minimize the chances of dependency issues from happening.
Indeed, the lockfile contains pinned versions of the dependencies
along with some info about the dependency artefacts to be installed
and some additional metadata.

By using a command like `poetry install`,
it is ensured that the dependency versions installed are well known,
and for example that they are the ones used during development phase
and during automated tests.

### Install without using Poetry

Poetry is a tool meant for development, it is not an installer, like *pip* for example.
It is debatable whether it is a good idea to use Poetry's `poetry install` command
to install and deploy in a production environment.
Some might prefer to use a dedicated installer tool, like pip for such a task.

But Poetry's lockfile format is not standardized, its content is specific to Poetry.
So this file is not immediately usable by other installers and tools.
For example pip can not understand `poetry.lock` and completely ignores it.
When running a command like `pip install mxcubeweb`
it will NOT choose the versions pinned in `poetry.lock`.

To circumvent this, one could use a command like `poetry export`
to generate a `requirements.txt` file compatible with pip (and some other tools).
With a series of commands like the following,
it should be possible to approximate the behaviour of installing with Poetry's lockfile.

1. Let Poetry export its lockfile into a pip-compatible requirements file

   ```shell
   poetry export --format=requirements.txt > requirements.txt
   ```

1. Move the `requirements.txt` file to the deployment target system

1. On the deployment system,
   let pip install {{project}} via the exported requirements file

   1. Install the dependencies

      ```shell
      python -m pip install --no-deps --requirement requirements.txt
      ```

   1. Install {{project}} itself,
      and make sure to skip the dependencies (with the `--no-deps` flag)
      since they are now already installed

      - For example as editable

        ```shell
        python -m pip install --no-deps --editable mxcubeweb
        ```

      - Or not

        ```shell
        python -m pip install --no-deps mxcubeweb
        ```
