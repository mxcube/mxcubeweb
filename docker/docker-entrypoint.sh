#!/bin/bash

# Enable conda for this shell
. /opt/conda/etc/profile.d/conda.sh

conda activate mxcube

cd /opt/mxcube3
vncserver :1 -geometry 1680x1050 -depth 24 &

redis-server &
python3 mxcube3-server -r test/HardwareObjectsMockup.xml --log-file mxcube.log &
npm start &
wait
