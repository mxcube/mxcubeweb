import os
import sys
import gevent
import gevent.event
import pytest
import json
from gevent import monkey 
monkey.patch_all(thread=False, subprocess=False)
sys.path.append('./')

# from flaskr import flaskr
from mxcube3 import app as mxcube

@pytest.fixture
def client():
    mxcube.config['TESTING'] = True
    client = mxcube.test_client()
    data = json.dumps({'proposal': 'idtest000',
    				   'password': 'sUpErSaFe'})

    resp = client.post("/mxcube/api/v0.1/login", data=data, content_type='application/json')
   
    yield client

def test_get_main(client):
    """Test if we can get the home page."""

    rv = client.get('/')
    assert rv.status_code == 200

def test_get_queue(client):
    """Test if we can get the queue."""

    rv = client.get('/mxcube/api/v0.1/queue')
    assert rv.status_code == 200

def test_get_item(client):
        """Test if we the queue has the intial sample, only mockups hwobj."""
        rv = client.get('/mxcube/api/v0.1/queue')

        assert (rv.status_code == 200 and json.loads(rv.data).get('1:01'))

def test_add_sample(client):
    """Test if we can add a sample."""
    sample_to_add = {
        'code': 'matr1_5',
        'checked': True,
        'sampleName': 'Sample-105',
        'sampleID': '1:05',
        'tasks': [],
        'location': '1:5',
        'defaultPrefix': 'local-user',
        'type': 'Sample'
    }

    rv = client.post('/mxcube/api/v0.1/queue',
                        data=json.dumps([sample_to_add]),
                        content_type='application/json'
                        )
    assert rv.status_code == 200

def test_add_and_get_sample(client):
    """Test if we can add a sample."""
    sample_to_add = {
        'code': 'matr1_5',
        'checked': True,
        'sampleName': 'Sample-105',
        'sampleID': '1:05',
        'tasks': [],
        'location': '1:5',
        'defaultPrefix': 'local-user',
        'type': 'Sample'
    }

    rv = client.post('/mxcube/api/v0.1/queue',
                        data=json.dumps([sample_to_add]),
                        content_type='application/json'
                        )
    assert rv.status_code == 200

    rv = client.get('/mxcube/api/v0.1/queue')

    assert (rv.status_code == 200 and json.loads(rv.data).get('1:05'))

