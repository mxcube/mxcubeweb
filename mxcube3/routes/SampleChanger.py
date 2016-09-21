import logging

import signals

from flask import Response, jsonify
from mxcube3 import app as mxcube


def init_signals():
    """Initialize hwobj signals."""
    mxcube.sample_changer.connect('stateChanged', signals.sc_state_changed)


@mxcube.route("/mxcube/api/v0.1/sample_changer/samples_list", methods=['GET'])
def get_samples_list():
    samples_list = mxcube.sample_changer.getSampleList()
    samples = {}
    for s in samples_list:
        sample_dm = s.getID() or ""
        samples.update(
            {s.getAddress():
                {
                 "sampleID": s.getAddress(),
                 "location": ":".join(map(str, s.getCoords())),
                 "code": sample_dm,
                 "type": "Sample",
                 "sampleName": "XTAL01",
                 "proteinAcronym": "TRYP"
                }
             }
            )
    return jsonify(samples)


@mxcube.route("/mxcube/api/v0.1/sample_changer/<sample>/mount", methods=['PUT'])
def mountSample(sample):
    # Most of this code should be moved to diffractometer or more general
    # beamline object. The route should probably not know details about if
    # the diffractometer has phase ... We should just need to do
    # beamline.mount_sample(location)
   
    try:
        pass
        # We are not using the sample changer to mount the sample, set
        # centering phase directly
        #if not mxcube.diffractometer.use_sc:
        #    mxcube.diffractometer.set_phase("Centring")

        mxcube.sample_changer.load(sample, False)

    except Exception:
        logging.getLogger('HWR').exception('[SC] sample could not be mounted')
        return Response(status=409)
    else:       
        # Clearing centered position
        mxcube.diffractometer.savedCentredPos = []
        mxcube.diffractometer.savedCentredPosCount = 1

        logging.getLogger('HWR').info('[SC] mounted %s' % sample)

        return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sample_changer/<sample>/unmount", methods=['PUT'])
def unmountSample(sample):
    try:
        use_sc = mxcube.diffractometer.use_sc

        if not use_sc: 
            mxcube.diffractometer.set_phase("Transfer")
            return Response(status=200)

        mxcube.sample_changer.unload(sample, False)

        #Remove Centring points
        mxcube.diffractometer.savedCentredPos = []
        mxcube.diffractometer.savedCentredPosCount = 1

        logging.getLogger('HWR').info('[SC] %s un-mounted %s' % sample)
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[SC] sample could not be mounted')
        return Response(status=409)
