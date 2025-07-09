!/usr/bin/env bash

{ # this ensures the entire script is downloaded #

system_has() {
  type "$1" > /dev/null 2>&1
}

mxcube_source() {
  echo "https://github.com/mxcube/mxcubeweb.git"
}

mxcube_install_dir() {
  echo "mxcubeweb"
}

mxcube_download() {
  if ! system_has git; then
    echo >&2 'You need git, curl, or wget to install MXCuBE'
    exit 1
  fi

  command git clone "$(mxcube_source)" "$(mxcube_install_dir)" || {
    echo >&2 'Failed to clone mxcube-3 repo. Please report this !'
    exit 2
  }

  command cd "$(mxcube_install_dir)"
  command git submodule init
  command git submodule update
}

install_conda_req() {
  command conda update -n base -c defaults conda
  command conda env create -f conda-environment.yml
}

mxcube_download
install_conda_req

} # this ensures the entire script is downloaded #
