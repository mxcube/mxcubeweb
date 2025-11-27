#!/bin/bash

# Script to restart mxcubeweb services on VMs

set -e

SCRIPT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "${SCRIPT_ROOT}/../")"

echo "=== Restarting mxcubeweb services ==="

ansible-playbook \
    "${PROJECT_ROOT}/playbooks/restart.yml" \
    -i "${PROJECT_ROOT}/inventory.yaml" \
    "$@"

echo ""
echo "=== Restart completed ==="
