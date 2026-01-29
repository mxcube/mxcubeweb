#!/bin/bash

# Script to deploy and start MXCubeWeb with SSH tunnel

set -e

SCRIPT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "${SCRIPT_ROOT}/../")"

# Configuration
VM_HOST=$(grep -A1 "mxcube_vm1:" "${PROJECT_ROOT}/inventory.yaml" | grep "ansible_host:" | awk '{print $2}')
REMOTE_PORT=8081
LOCAL_PORT=8081
BLISS_REMOTE_PORT=5000
BLISS_LOCAL_PORT=5000

echo "=== MXCubeWeb Deployment and Start ==="
echo ""

# Ask if user wants to deploy
read -p "Do you want to deploy/update MXCubeWeb? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "${SCRIPT_ROOT}/deploy.sh"

    if [ $? -ne 0 ]; then
        echo "Deployment failed!"
        exit 1
    fi
    echo ""
fi

echo "Checking service status on ${VM_HOST}..."
if ssh ${VM_HOST} "systemctl is-active --quiet mxcubeweb-mxcube_vm1"; then
    echo "Service is running"
else
    echo "Service is not running, starting it..."
    ssh ${VM_HOST} "sudo systemctl start mxcubeweb-mxcube_vm1"
    sleep 3
fi

echo "Checking if port ${REMOTE_PORT} is listening on ${VM_HOST}..."
if ! ssh ${VM_HOST} "ss -tlnp | grep -q :${REMOTE_PORT}"; then
    echo "Warning: Port ${REMOTE_PORT} is not listening on ${VM_HOST}"
fi

# Ask if user wants to create SSH tunnel
echo ""
read -p "Do you want to create SSH tunnel? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Kill existing tunnels
    echo "Cleaning up existing SSH tunnels..."
    pkill -f "ssh.*-L.*${LOCAL_PORT}:localhost:${REMOTE_PORT}" 2>/dev/null || true
    sleep 1

    # Create SSH tunnel

    echo ""
    echo "Creating SSH tunnels..."
    echo "MXCubeWeb - Local port: ${LOCAL_PORT} "
    echo "Video Streamer - Local port: 8000"
    echo "Bliss REST API - Local port: ${BLISS_LOCAL_PORT}"
    echo "MXCubeWeb URL: http://localhost:${LOCAL_PORT}"
    echo "Bliss API URL: http://localhost:${BLISS_LOCAL_PORT}/api/info"
    echo ""
    echo "Use scripts/stop.sh to stop the tunnels and close the application"
    echo ""

    ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} -L 8000:localhost:8000 -L ${BLISS_LOCAL_PORT}:localhost:${BLISS_REMOTE_PORT} ${VM_HOST}
else
    echo ""
    echo "No SSH tunnel created."
    echo ""
fi
