#!/bin/bash

# Enable conda for this shell
. /opt/conda/etc/profile.d/conda.sh

conda activate mxcube

vncserver :1 -geometry 1680x1050 -depth 24 &

cd /opt/mxcubeweb

npm install --global pnpm@9
pnpm --prefix ui install
pnpm --prefix ui start &

redis-server &

python3 mxcubeweb-server --repository test/HardwareObjectsMockup.xml --log-file mxcube.log &

wait
