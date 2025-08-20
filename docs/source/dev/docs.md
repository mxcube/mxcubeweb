# Working with documentation

This documentation is automatically built and published from the contents of the [mxcubeweb](https://github.com/mxcube/mxcubeweb) repository.
Each time the repository's `develop` branch is updated, documentation is regenerated and published to [https://mxcubeweb.readthedocs.io/](https://mxcubeweb.readthedocs.io/)

If you want to modify this documentation, make a pull request to the repository with your suggested changes.

## Modifying the documentation

This documentation is built using the [Sphinx](https://www.sphinx-doc.org/) documentation generator.
The documentation's source and configuration files are located in the `docs` folder of the [mxcubeweb](https://github.com/mxcube/mxcubeweb) repository.
Sphinx will also read [Python docstrings](https://peps.python.org/pep-0257/) from the repository's source code.

### Building documentation

Follow the instructions for [Installing a development environment](environment.md).
The development environment will include Sphinx and all necessary packages for building documentation.

Once you have a working environment, use these commands to build the documentation:

```
# goto docs folder
$ cd docs

# build documents with Sphinx
$ make html
```

The commands above will generate documentation in `docs/html/` directory.
The generated docs can be viewed by opening `docs/html/index.html` in your web browser.
