from setuptools import setup, find_packages

setup(
    name="mxcube",
    version="3.2-alpha",
    description="Macromolecular Xtallography Customized Beamline Environment",
    author="MXCuBE collaboration",
    license="LGPL-3.0",
    url="https://github.com/mxcube/mxcube3",
    packages=find_packages(),
    package_data={"mxcube3": ['js/*', 'static/*', "video/*js"]},
    scripts=["mxcube3-server"]
)
