from flask import session, request, Response, jsonify
from mxcube3 import app as mxcube
import logging

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
                 "type": "Sample"
                }
             }
            )
    return jsonify(samples)


@mxcube.route("/mxcube/api/v0.1/sample_changer/<sample_location>/mount", methods=['PUT'])
def mountSample(sample_location):
    # Most of this code should be moved to diffractometer or more general
    # beamline object. The route should probably not know details about if
    # the diffractometer has phase ... We should just need to do
    # beamline.mount_sample(location)
   
    try:
        # We are not using the sample changer to mount the sample, set
        # centering phase directly
        if not mxcube.diffractometer.use_sc:
            mxcube.diffractometer.set_phase("Centring")

        # Make the necessary call to load sample on location sample_location
        # The underlying sample changer object should handle mounting from
        # string repr
        # mxcube.sample_changer.load_sample(sample_location)

    except Exception:
        logging.getLogger('HWR').exception('[SC] sample could not be mounted')
        return Response(status=409)
    else:       
        # Clearing centered position
        mxcube.diffractometer.savedCentredPos = []
        mxcube.diffractometer.savedCentredPosCount = 1

        logging.getLogger('HWR').info('[SC] mounted %s' % sample_location)

        return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sample_changer/<sample>/unmount", methods=['PUT'])
def unmountSample(sample):
    try:
        sampleNode = mxcube.queue.get_node(int(sample))
        sampleLocation = sampleNode.location

        use_sc = mxcube.diffractometer.use_sc
        if use_sc is False: # manual, not using sample_changer
            mxcube.diffractometer.set_phase("Transfer")
            return Response(status=200)

        #Remove Centring points
        mxcube.diffractometer.savedCentredPos = []
        mxcube.diffractometer.savedCentredPosCount = 1

        # move to history

        #mxcube.sample_changer.load_sample
        #TODO: figure out how to identify the sample for the sc, selectsample&loadsamplae&etc
        logging.getLogger('HWR').info('[SC] %s sample mounted, location: %s' % (sample, sampleLocation))
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[SC] sample could not be mounted')
        return Response(status=409)
