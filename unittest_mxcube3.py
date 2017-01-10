import unittest
import json

from mxcube3 import app as mxcube
from mxcube3 import hwr

mxcube.queue = hwr.getHardwareObject('/queue-model')


class TestCase(unittest.TestCase):
    def setUp(self):
        mxcube.config['TESTING'] = True
        mxcube.config['WTF_CSRF_ENABLED'] = False
        self.app = mxcube.test_client()

    def tearDown(self):
        pass

    def test_1_add_item(self):
        """Test if we can add a sample."""
        print '############### TEST ###############'
        print 'TEST: add sample'
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

        res = self.app.post('/mxcube/api/v0.1/queue',
                            data=json.dumps([sample_to_add]),
                            content_type='application/json'
                            )

        self.assertTrue(res.status == '200 OK')

    def test_2_get_item(self):
        """Test if we can retrieve the previously added sample."""
        print '############### TEST ###############'
        print 'TEST: get sample'
        res = self.app.get('/mxcube/api/v0.1/queue')

        self.assertTrue(res.status == '200 OK' and json.loads(res.data).get('1:05'))

    def test_3_delete_sample(self):
        """Test if we can delte the previously added sample."""
        print '############### TEST ###############'
        print 'TEST: delete sample'
        res = self.app.delete('/mxcube/api/v0.1/queue/1:05/undefined')
        q = self.app.get('/mxcube/api/v0.1/queue')
        self.assertTrue(res.status == '200 OK' and not json.loads(q.data).get('1:05'))

if __name__ == '__main__':
    unittest.main()
