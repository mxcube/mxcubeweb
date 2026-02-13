#!/bin/bash

# Script to run the Ansible playbook that deploys MXCubeWeb

set -e

SCRIPT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "${SCRIPT_ROOT}/../")"

echo "=== Running MXCubeWeb deploy playbook ==="

if ! command -v ansible-playbook >/dev/null 2>&1; then
    echo "ansible-playbook not found. Please install Ansible (./scripts/install_ansible.sh)"
    exit 2
fi

PLAYBOOK="${PROJECT_ROOT}/playbooks/deploy_vm.yml"
INVENTORY="${PROJECT_ROOT}/inventory.yaml"

if [ ! -f "${PLAYBOOK}" ]; then
    echo "Playbook not found: ${PLAYBOOK}"
    exit 1
fi

ansible-playbook -i "${INVENTORY}" "${PLAYBOOK}" "$@"

echo "=== Deploy finished ==="
