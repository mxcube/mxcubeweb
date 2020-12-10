import json

from fixture import client

test_proposal = {'Proposal': {'Laboratory': {'laboratoryId': 1, 'name': 'TEST eh1'}, 'Person': {'familyName': 'operator on IDTESTeh1', 'laboratoryId': 1, 'login': None, 'personId': 1}, 'Proposal': {'code': 'idtest', 'number': '0', 'personId': 1, 'proposalId': 1, 'title': 'operator on IDTESTeh1', 'type': 'MX'}, 'Session': [{'beamlineName': 'mxcube3test', 'comments': 'Session created by the BCM', 'endDate': '2023-06-12 07:59:59', 'nbShifts': 3, 'proposalId': 1, 'scheduled': 0, 'sessionId': 34591, 'startDate': '2013-06-11 00:00:00', 'timeStamp': 'Tue, 11 Jun 2013 09:40:36 GMT'}], 'status': {'code': 'ok'}}}

def test_set_proposal(client):
    """Test if we can set a proposal."""
    resp = client.post(
        ("/mxcube/api/v0.1/lims/proposal"),
        data=json.dumps({"proposal_number": "idtest0"}),
        content_type="application/json",
    )
    assert resp.status_code == 200

def test_get_proposal(client):
    """Test if we can get a proposal."""
    resp = client.get("/mxcube/api/v0.1/lims/proposal")
    _proposal = json.loads(resp.data)
    assert resp.status_code == 200
    assert _proposal == test_proposal