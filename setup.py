from distutils.core import setup

setup(name="MXCuBE", version="3",
      description = "Macromolecular Xtallography Customized Beamline Environment",
      author = "MXCuBE collaboration (ESRF, Soleil, MAX IV, HZB, EMBL, Global Phasing Ltd.)",
      package_dir = { "mxcube3": "src" },
      packages = ["mxcube3", 
                  "mxcube3.HardwareRepository",
                  "mxcube3.HardwareRepository.HardwareObjects", 
                  "mxcube3.HardwareRepository.Command", 
                  "mxcube3.HardwareObjects", 
                  "mxcube3.HardwareObjects.sample_changer",
                  "mxcube3.HardwareObjects.detectors",
                  "mxcube3.HardwareObjects.Native",
                  "mxcube3.HardwareObjects.ESRF",
                  "mxcube3.HardwareObjects.SOLEIL",
                  "mxcube3.routes"],
      package_data = { "mxcube3": ['js/*', 'static/*'] },
      scripts=["mxcube3"]
)
