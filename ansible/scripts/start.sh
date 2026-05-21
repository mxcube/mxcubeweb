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
    echo ""
    echo "  [1] Quick update  — sync code only, skip apt packages and Docker downloads."
    echo "      Conda envs auto-skipped if already installed; UI rebuilt only if sources changed."
    echo "  [2] Full deploy   — install everything from scratch (first time, or after env changes)."
    echo ""
    read -p "Choose [1/2, default=1]: " -n 1 -r DEPLOY_TYPE
    echo
    DEPLOY_TYPE=${DEPLOY_TYPE:-1}

    if [[ $DEPLOY_TYPE == "2" ]]; then
        "${SCRIPT_ROOT}/deploy.sh" -K
    else
        "${SCRIPT_ROOT}/deploy.sh" --quick -K
    fi

    if [ $? -ne 0 ]; then
        echo "Deployment failed!"
        exit 1
    fi
    echo ""
fi

# Ensure bliss services have a fresh process (beacon CWD can become stale after tmpdir cleanup)
if ssh ${VM_HOST} "systemctl is-active --quiet bliss-server-mxcube_vm1" 2>/dev/null; then
    echo "Restarting bliss-server to ensure fresh Beacon process..."
    ssh ${VM_HOST} "sudo systemctl restart bliss-server-mxcube_vm1"
    sleep 5
fi

echo "Waiting for BLISS REST API to be ready on ${VM_HOST}:${BLISS_REMOTE_PORT}..."
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if ssh ${VM_HOST} "curl -sf http://localhost:${BLISS_REMOTE_PORT}/api/info > /dev/null 2>&1"; then
        echo "BLISS REST API is ready!"
        break
    fi
    echo -n "."
    sleep 2
    WAITED=$((WAITED + 2))
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "Warning: BLISS REST API not reachable after ${MAX_WAIT}s — mxcubeweb may fail to connect."
    echo "--- Bliss SERVER service status ---"
    ssh ${VM_HOST} "systemctl status bliss-server-mxcube_vm1 --no-pager -l" || true
    echo "--- Last 50 bliss-server log lines ---"
    ssh ${VM_HOST} "sudo journalctl -u bliss-server-mxcube_vm1 -n 50 --no-pager 2>/dev/null || journalctl -u bliss-server-mxcube_vm1 -n 50 --no-pager" || true
    echo "--- Bliss SESSION service status ---"
    ssh ${VM_HOST} "systemctl status bliss-session-mxcube_vm1 --no-pager -l" || true
    echo "--- Last 50 bliss-session log lines ---"
    ssh ${VM_HOST} "sudo journalctl -u bliss-session-mxcube_vm1 -n 50 --no-pager 2>/dev/null || journalctl -u bliss-session-mxcube_vm1 -n 50 --no-pager" || true
    echo "--- Beacon port check ---"
    ssh ${VM_HOST} "ss -tlnp | grep -E '10001|10000|5000'" || true
fi

echo "Checking mxcubeweb service status on ${VM_HOST}..."
if ssh ${VM_HOST} "systemctl is-active --quiet mxcubeweb-mxcube_vm1"; then
    echo "Service is running — restarting to pick up fresh BLISS connection..."
    ssh ${VM_HOST} "sudo systemctl restart mxcubeweb-mxcube_vm1"
else
    echo "Service is not running, starting it..."
    ssh ${VM_HOST} "sudo systemctl start mxcubeweb-mxcube_vm1"
fi

echo "Waiting for mxcubeweb to be ready..."
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if ssh ${VM_HOST} "systemctl is-active --quiet mxcubeweb-mxcube_vm1 && ss -tlnp | grep -q :${REMOTE_PORT}"; then
        echo "MXCubeWeb is ready!"
        break
    fi
    echo -n "."
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo ""
    echo "Warning: mxcubeweb did not start after ${MAX_WAIT}s"
    echo "--- Service status ---"
    ssh ${VM_HOST} "systemctl status mxcubeweb-mxcube_vm1 --no-pager -l" || true
    echo "--- Last 30 log lines ---"
    ssh ${VM_HOST} "journalctl -u mxcubeweb-mxcube_vm1 -n 30 --no-pager" || true
else
    echo ""
fi

# Check video streamer (optional — does not block startup)
if ssh ${VM_HOST} "ss -tlnp | grep -q :8000" 2>/dev/null; then
    VIDEO_STREAMER_UP=true
    echo "Video streamer is ready on port 8000."
else
    VIDEO_STREAMER_UP=false
    echo "Video streamer not detected on port 8000 — skipping (optional)."
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
    echo "MXCubeWeb      - Local port: ${LOCAL_PORT}"
    echo "Bliss REST API - Local port: ${BLISS_LOCAL_PORT}"
    if [ "${VIDEO_STREAMER_UP}" = true ]; then
        echo "Video Streamer - Local port: 8000"
    fi
    echo "MXCubeWeb URL: http://localhost:${LOCAL_PORT}"
    echo "Bliss API URL: http://localhost:${BLISS_LOCAL_PORT}/api/info"
    echo ""
    echo "Use scripts/stop.sh to stop the tunnels and close the application"
    echo ""

    if [ "${VIDEO_STREAMER_UP}" = true ]; then
        ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} -L 8000:localhost:8000 -L ${BLISS_LOCAL_PORT}:localhost:${BLISS_REMOTE_PORT} ${VM_HOST}
    else
        ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} -L ${BLISS_LOCAL_PORT}:localhost:${BLISS_REMOTE_PORT} ${VM_HOST}
    fi
else
    echo ""
    echo "No SSH tunnel created."
    echo ""
fi