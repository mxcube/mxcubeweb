# MXCubeWeb Ansible Deployment

Automated deployment of MXCubeWeb on virtual machines.

## Prerequisites

1. **Ansible** installed on your local machine
2. **SSH access** to target VMs
3. **Docker** installed on VMs with docker-compose
4. **Docker images** loaded on VMs (`flex-server:latest` and `arinax:MD`)

## Quick Start

### 0. Install Ansible and dependencies

Before running any deployment, install Ansible and required Python dependencies:

```bash
cd ansible
python3 -m pip install ansible
"OR if you need some dependencies you can add them to requirements.txt and use this instead:"
python3 -m pip install -r "/requirements.txt"
```

This command will install Ansible (and any dependencies listed in `scripts/requirements.txt`) using pip. You only need to do this once per machine.

### 1. Configure inventory

Edit `inventory.yaml` to add your VMs:

```yaml
mxcube_vms:
  hosts:
    mxcube_vm1:
      ansible_host: your-vm-hostname
      vm_context: "mxcube_vm1"
```

### 2. Configure variables

Edit `playbooks/group_vars/all.yml` to customize:

```yaml
install_base_path: "/opt/mxcube" # Installation path
service_user: "mxcube" # System user
use_local_repos: true # Use local repos or clone from GitHub
mxcubeweb_version: "develop" # Git branch
```

### 3. Prepare VMs (first time only)

On each VM, load Docker images once:

```bash
# Copy docker images files to the VM
scp flex-server-simulation_20241212.tar your-vm:/tmp/
scp arinax_md.tar your-vm:/tmp/

# On the VM, load images
ssh your-vm
docker load -i /tmp/flex-server-simulation_20241212.tar
docker load -i /tmp/arinax_md.tar
```

#### 4. Configure your SSH connection (first time only)

To set up SSH keys and configure access to your VM, use the provided script:

```bash
cd ansible
./scripts/setup_ssh.sh
```

This script will:

- Generate an SSH key pair if you don't have one
- Copy your public key to the VM(s) listed in `inventory.yaml`
- Ensure passwordless SSH access for Ansible and deployment scripts

Follow the prompts in the script to complete the setup. You only need to do this once per machine.

### 5. Deploy

```bash
cd ansible
./scripts/start.sh
```

The script will:

- Ask if you want to deploy/update MXCubeWeb
- Start the service if not running
- Ask if you want to create an SSH tunnel to access the web interface

If you create the SSH tunnel, access MXCubeWeb at: http://localhost:8081

If you don't create the tunnel, access MXCubeWeb directly at: http://your-vm-hostname:8081

## Available Scripts

- `scripts/start.sh` - Deploy and start with SSH tunnel
- `scripts/deploy.sh` - Deploy only
- `scripts/stop.sh` - Stop services
- `scripts/setup_ssh.sh` - Configure SSH keys
- `scripts/install_ansible.sh` - Install Ansible dependencies

## Manual Deployment

Run Ansible playbook directly:

```bash
ansible-playbook -i inventory.yaml playbooks/deploy_vm.yml
```

Deploy only specific parts using tags (can be use to update):

```bash
# Deploy only [tags]
ansible-playbook -i inventory.yaml playbooks/deploy_vm.yml --tags tagsnames

# Multiple tags
ansible-playbook -i inventory.yaml playbooks/deploy_vm.yml --tags tag1,tag2,...
```

Available tags:

- `update`: Only update code, install Python/JS dependencies, and build the frontend (no full redeploy)
- `system`: Install system packages (git, python, build tools, etc.)
- `dependencies`: Install all dependencies (system, Python, JS)
- `setup`: Create base directories and perform initial setup
- `conda`: Install or update the Conda environment
- `repositories`: Copy or clone the mxcubecore and mxcubeweb repositories
- `python`: Install Python dependencies (e.g. with Poetry)
- `ui`: Install and build the frontend (pnpm install/build)
- `docker`: Manage Docker containers (start/stop with docker-compose)
- `service`: Manage the systemd service for MXCubeWeb
- `systemd`: Create or reload systemd service files

See deploy_vm.yml for more information about each tag.

## Service Management

On the VM:

```bash
# Check status
systemctl status mxcubeweb-mxcube_vm1

# View logs
journalctl -u mxcubeweb-mxcube_vm1 -f

# Restart
sudo systemctl restart mxcubeweb-mxcube_vm1
```
