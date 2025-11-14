#!/bin/bash

# Script to install Ansible and required dependencies

set -e

SCRIPT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=== Installing Ansible and dependencies ==="

# Install Python dependencies
if [ -f "${SCRIPT_ROOT}/requirements.txt" ]; then
    echo "Installing Python packages..."
    python3 -m pip install -r "${SCRIPT_ROOT}/requirements.txt"
else
    echo "Installing Ansible..."
    python3 -m pip install ansible
fi

echo "=== Installation completed ==="
echo ""
echo "Deploy: ./scripts/deploy.sh"
echo "Start: ./scripts/start.sh"
