#!/bin/bash

# Enable conda for this shell
. /opt/conda/etc/profile.d/conda.sh

conda activate mxcube

vncserver :1 -geometry 1680x1050 -depth 24 &

cd /opt/mxcube3

npm install --legacy-peer-deps
npm start &

redis-server &

python3 mxcube3-server -r test/HardwareObjectsMockup.xml --log-file mxcube.log &

wait
