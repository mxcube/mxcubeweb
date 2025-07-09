curl -i -X POST  -H 'Content-Type: application/json'  -d '{"SampleId": "1:07"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue'
curl -i -X POST  -H 'Content-Type: application/json'  -d '{"SampleId": "1:08"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue'
curl -i -X POST  -H 'Content-Type: application/json'  -d '{"SampleId": "1:09"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue'

curl -i -X PUT  -H 'Content-Type: application/json'  -d '{"param1":"1"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue/1'
curl -i -X PUT  -H 'Content-Type: application/json'  -d '{"param3":"3"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue/1'

curl -i -X POST -H 'Content-Type: application/json'  -d '{"Type":"Centring"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue/1'
curl -i -X POST -H 'Content-Type: application/json'  -d '{"Type":"Characterisation"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue/1'
curl -i -X POST -H 'Content-Type: application/json'  -d '{"Type":"Characterisation"}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue/1'

curl -i -X PUT -H 'Content-Type: application/json'  -d '{"checked":0}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue/1/5'
curl -i -X PUT -H 'Content-Type: application/json'  -d '{"checked":0}' 'http://w-v-kitslab-mxcube-0:8085/mxcube/api/v0.1/queue/1/4'
