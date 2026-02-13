#!/bin/bash

# Script to stop MXCubeWeb service and close SSH tunnels

set -e

SCRIPT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "${SCRIPT_ROOT}/../")"

# Configuration
VM_HOST=$(grep -A1 "mxcube_vm1:" "${PROJECT_ROOT}/inventory.yaml" | grep "ansible_host:" | awk '{print $2}')
SERVICE_NAME="mxcubeweb-mxcube_vm1"

echo "=== Stopping MXCubeWeb ==="
echo ""

# Stop the service on the VM
echo "Stopping service ${SERVICE_NAME} on ${VM_HOST}..."
if ssh ${VM_HOST} "systemctl is-active --quiet ${SERVICE_NAME}"; then
    ssh ${VM_HOST} "sudo systemctl stop ${SERVICE_NAME}"
    echo "Service stopped"
else
    echo "Service is already stopped"
fi

# Kill SSH tunnels
echo ""
echo "Closing SSH tunnels..."
pkill -f "ssh.*-L.*8081:localhost:8081.*${VM_HOST}" 2>/dev/null && echo " Closed tunnel on port 8081" || echo "No tunnel found on port 8081"
pkill -f "ssh.*-L.*8000:localhost:8000.*${VM_HOST}" 2>/dev/null && echo " Closed tunnel on port 8000" || echo "No tunnel found on port 8000"

echo ""
echo "=== MXCubeWeb stopped ==="
