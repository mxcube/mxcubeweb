#!/usr/bin/env bash

{ # this ensures the entire script is downloaded #

system_has() {
  type "$1" > /dev/null 2>&1
}

mxcube_web_source() {
  echo "https://github.com/mxcube/mxcubeweb.git"
}

mxcubecore_source() {
  echo "https://github.com/mxcube/mxcubecore.git"
}

mxcube_install_dir() {
  echo "mxcube-web"
}

mxcubecore_install_dir() {
  echo "mxcubecore"
}

mxcube_download() {
  if ! system_has git; then
    echo >&2 'You need git, curl, or wget to install MXCuBE'
    exit 1
  fi

  command git clone "$(mxcube_web_source)" "$(mxcube_install_dir)" || {
    echo >&2 'Failed to clone mxcube-3 repo. Please report this !'
    exit 2
  }

  command git clone "$(mxcubecore_source)" "$(mxcubecore_install_dir)" || {
    echo >&2 'Failed to clone mxcubeore repo. Please report this !'
    exit 2
  }

  command cd "$(mxcubecore_install_dir)"
  command pip install -e .
  command cd ..

  command cd "$(mxcube_install_dir)"
}

init_conda() {
  command conda create --name mxcubeweb
  command conda env update --name mxcubeweb --file conda-environment.yml
  command conda activate mxcubeweb
}


install_node() {
  command npm install --global pnpm@9
  command pnpm --prefix ui install
}

mxcube_download
init_conda
install_node

} # this ensures the entire script is downloaded #
