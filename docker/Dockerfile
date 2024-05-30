# syntax=docker/dockerfile:1.6

##############################################################################
# Dockerfile to run MXCuBE web server
##############################################################################

# Global build arguments
ARG DEBIAN_FRONTEND=noninteractive
ARG PYTHON_VERSION=3.10


### Download Miniconda3 Setup ###
FROM scratch AS conda_setup_download

ARG CONDA_VERSION=py312_24.4.0-0
ARG CONDA_SETUP_SHA256=b6597785e6b071f1ca69cf7be6d0161015b96340b9a9e132215d5713408c3a7c
ADD --checksum=sha256:${CONDA_SETUP_SHA256} \
    --chmod=744 \
    https://repo.anaconda.com/miniconda/Miniconda3-${CONDA_VERSION}-Linux-x86_64.sh \
    /opt/conda/conda_setup.sh

#### MXCuBE Backend ####
FROM debian:12-slim AS runtime

LABEL maintainer="The MXCuBE collaboration <mxcube@esrf.fr>"

ARG DEBIAN_FRONTEND
ARG PYTHONUNBUFFERED=1
ARG PYTHON_VERSION
ARG PIP_ROOT_USER_ACTION=ignore
ARG PIP_DISABLE_PIP_VERSION_CHECK=1
ARG POETRY_VIRTUALENVS_IN_PROJECT=true
ARG POETRY_VIRTUALENVS_CREATE=false
ARG POETRY_NO_INTERACTION=1
ARG POETRY_DEPENDENCY_GROUPS=main
ENV PATH="/opt/conda/bin:${PATH}"
ENV GEVENT_SUPPORT=True

# Install system packages
RUN <<EOT bash
set -eux
apt-get update

# Install system packages
apt-get install -y \
    apt-utils gcc curl git sudo build-essential wget nano vim bzip2 \
    ca-certificates libglib2.0-0 libxext6 libsm6 libxrender1 libgl1-mesa-glx \
    libxi6 libsasl2-dev python-dev-is-python3 libldap2-dev libssl-dev

rm -rf /var/lib/apt/lists/*
EOT

# Copy across Conda setup from "conda_setup_download" step
WORKDIR /opt/conda
COPY --from=conda_setup_download /opt/conda/conda_setup.sh \
    /opt/conda/conda_setup.sh

# Install Conda
RUN <<EOT bash
set -eux
/opt/conda/conda_setup.sh -b -u -p /opt/conda
rm /opt/conda/conda_setup.sh
ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh
echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc
find /opt/conda/ -follow -type f -name '*.a' -delete
find /opt/conda/ -follow -type f -name '*.js.map' -delete
/opt/conda/bin/conda clean -afy
EOT

# Configure Conda global settings (/opt/conda/.condarc)
RUN <<EOT bash
set -eux
/opt/conda/bin/conda config --system --stdin <<-CONDARC
always_yes: true
auto_activate_base: false
auto_update_conda: false
channels:
  - conda-forge
  - anaconda
  - defaults
number_channel_notices: 0
notify_outdated_conda: false
report_errors: false
CONDARC
/opt/conda/bin/conda config --system --validate
EOT

# Install project Conda environment
WORKDIR /opt/mxcubeweb
RUN <<EOT bash
set -eux
. /opt/conda/etc/profile.d/conda.sh

# Install project in new environment
conda create --name mxcubeweb --platform linux-64 \
    --no-lock --no-default-packages --copy --no-shortcuts --quiet \
    "conda-forge::python=${PYTHON_VERSION}" \
    "conda-forge::nodejs=20.12.2" \
    "conda-forge::ffmpeg=7.0.1" \
    "conda-forge::poetry=1.8.3" \
    "conda-forge::pip"

echo "conda activate mxcubeweb" >> ~/.bashrc
conda config --env --set env_prompt "(MXCuBE) "
EOT

# Install `pnpm`
RUN <<'EOT' bash
set -eux;
source ~/.bashrc
npm install -g pnpm
EOT

# Build UI
COPY --link ./ui /opt/mxcubeweb/ui
WORKDIR /opt/mxcubeweb/ui
RUN <<EOT bash
set -eux;
source ~/.bashrc
npm install
npm run build
EOT

# Install project dependencies
ADD --keep-git-dir=true https://github.com/mxcube/mxcubecore.git#develop /opt/mxcubecore
WORKDIR /opt/mxcubeweb
COPY --link \
    ./mxcubeweb/__init__.py ./mxcubeweb/__version__.py \
    ./pyproject.toml ./poetry.lock ./README.md \
    ./
RUN <<'EOT' bash
set -eux;
source ~/.bashrc
poetry install --compile --only main
EOT

# Copy across project files
COPY --link ./.git ./.git
COPY --link ./mxcubeweb ./mxcubeweb
COPY --link ./test ./test
COPY --link ./LICENSE ./mxcubeweb-server ./ 

# Add entrypoint script
COPY --chmod=744 <<'EOF' entrypoint.sh
#!/usr/bin/env bash
set -eux;

source ~/.bashrc

echo "  __  ____   _______      ____  ______ ";
echo " |  \/  \ \ / / ____|    |  _ \|  ____|";
echo " | \  / |\ V / |    _   _| |_) | |__   ";
echo " | |\/| | > <| |   | | | |  _ <|  __|  ";
echo " | |  | |/ . \ |___| |_| | |_) | |____ ";
echo " |_|  |_/_/ \_\_____\__,_|____/|______|";
echo "                                       ";
exec "$@"
EOF

EXPOSE 8081
ENTRYPOINT [ "/opt/mxcubeweb/entrypoint.sh" ]
CMD [ "python", "./mxcubeweb-server", "--repository", "/opt/mxcubeweb/test/HardwareObjectsMockup.xml", "--static-folder", "/opt/mxcubeweb/ui/build" ]
