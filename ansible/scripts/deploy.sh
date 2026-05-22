#!/bin/bash

# Script to run the Ansible playbook that deploys MXCubeWeb
#
# Usage:
#   ./deploy.sh              Full deploy (installs envs, builds UI, etc.)
#   ./deploy.sh --quick      Quick update: skips apt packages and Docker images.
#                            Conda envs and UI build are auto-skipped when already
#                            up-to-date (idempotency guards in the playbook).
#   ./deploy.sh --tags update  Ansible pass-through: only run tasks tagged 'update'

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

# Parse --quick flag; pass everything else through to ansible-playbook
QUICK=false
EXTRA_ARGS=()
for arg in "$@"; do
    case "$arg" in
        --quick|-q)
            QUICK=true
            ;;
        *)
            EXTRA_ARGS+=("$arg")
            ;;
    esac
done

if [ "$QUICK" = true ]; then
    echo "(quick mode: skipping system packages and Docker image downloads)"
    ansible-playbook -i "${INVENTORY}" "${PLAYBOOK}" --skip-tags "system,docker" "${EXTRA_ARGS[@]}"
else
    # Pass -K (ask for sudo password) only if the user has not already set up
    # passwordless sudo via setup_ssh.sh.  We probe with a quick ad-hoc task;
    # if it fails we add --ask-become-pass automatically.
    if ansible -i "${INVENTORY}" all -m command -a "true" --become --timeout 10 -q 2>/dev/null; then
        ansible-playbook -i "${INVENTORY}" "${PLAYBOOK}" "${EXTRA_ARGS[@]}"
    else
        echo "Sudo requires a password on the target — you will be prompted once."
        ansible-playbook -i "${INVENTORY}" "${PLAYBOOK}" --ask-become-pass "${EXTRA_ARGS[@]}"
    fi
fi

echo "=== Deploy finished ==="
