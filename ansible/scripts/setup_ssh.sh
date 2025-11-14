#!/bin/bash

# Script to configure SSH access to VMs

set -e

SCRIPT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(realpath "${SCRIPT_ROOT}/../")"

echo "=== Configuring SSH access to VMs ==="

# Check if ed25519 SSH key exists, or generate one

if [ -f ~/.ssh/id_ed25519.pub ]; then
    KEY_FILE=~/.ssh/id_ed25519
    echo "Found ed25519 SSH key"
else
    echo "No ed25519 SSH key found. Generating new key..."
    ssh-keygen -t ed25519 -C "mxcube-ansible-$(date +%Y%m%d)" -N "" -f ~/.ssh/id_ed25519
    KEY_FILE=~/.ssh/id_ed25519
    echo "Generated ed25519 key"
fi

echo ""
echo "The VMs defined in inventory.yaml:"
ansible mxcube_vms -i "${PROJECT_ROOT}/inventory.yaml" --list-hosts

echo ""
echo "Copying SSH key to VMs..."
echo ""

# Get list of hosts from inventory
HOSTS=$(ansible mxcube_vms -i "${PROJECT_ROOT}/inventory.yaml" --list-hosts | grep -v "hosts" | tr -d ' ')

for HOST in $HOSTS; do
    ANSIBLE_DATA=$(ansible-inventory -i "${PROJECT_ROOT}/inventory.yaml" --host "$HOST" --json 2>/dev/null || true)

    if command -v jq >/dev/null 2>&1 && [ -n "$ANSIBLE_DATA" ]; then
        # Use jq for reliable JSON parsing
        ANSIBLE_HOST=$(echo "$ANSIBLE_DATA" | jq -r '.ansible_host // empty')
        ANSIBLE_USER=$(echo "$ANSIBLE_DATA" | jq -r '.ansible_user // empty')
        ANSIBLE_PORT=$(echo "$ANSIBLE_DATA" | jq -r '.ansible_port // empty')
    else
        # Fallback to grep/cut parsing
        ANSIBLE_HOST=$(ansible-inventory -i "${PROJECT_ROOT}/inventory.yaml" --host "$HOST" | grep -o '"ansible_host": "[^"]*"' | cut -d'"' -f4)
        ANSIBLE_USER=$(ansible-inventory -i "${PROJECT_ROOT}/inventory.yaml" --host "$HOST" | grep -o '"ansible_user": "[^"]*"' | cut -d'"' -f4)
        ANSIBLE_PORT=$(ansible-inventory -i "${PROJECT_ROOT}/inventory.yaml" --host "$HOST" | grep -o '"ansible_port": "[^"]*"' | cut -d'"' -f4)
    fi

    TARGET_HOST=${ANSIBLE_HOST:-$HOST}
    TARGET_USER=${ANSIBLE_USER:-$USER}

    SSH_PORT_ARG=""
    if [ -n "$ANSIBLE_PORT" ]; then
        SSH_PORT_ARG="-p ${ANSIBLE_PORT}"
        echo "Copying SSH key to ${TARGET_USER}@${TARGET_HOST}:${ANSIBLE_PORT}..."
    else
        echo "Copying SSH key to ${TARGET_USER}@${TARGET_HOST}..."
    fi

    if ssh-copy-id -i "${KEY_FILE}" ${SSH_PORT_ARG} "${TARGET_USER}@${TARGET_HOST}" 2>&1; then
        echo "✓ Successfully copied SSH key to ${TARGET_HOST}"
    else
        echo "Failed to copy SSH key to ${TARGET_HOST}"
    fi
    echo ""
done

echo "=== SSH configuration completed ==="
