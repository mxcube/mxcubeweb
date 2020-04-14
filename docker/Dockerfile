##############################################################################
# Dockerfile to run MXCuBE web server
##############################################################################

FROM debian:10
MAINTAINER Marcus Oscarsson <marcus.oscarsson@esrf.fr>

ENV TERM linux
ENV USER root

# Install system pacakges

RUN apt-get update && apt-get -y upgrade && \
    DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y mate-desktop-environment-core && \
    apt-get install -y apt-utils curl git sudo build-essential wget \
    tightvncserver emacs xemacs21 vim procps

RUN mkdir /root/.vnc && echo "mxcube" | vncpasswd -f > /root/.vnc/passwd && chmod 600 /root/.vnc/passwd
RUN touch /root/.Xresources && touch /root/.Xauthority

RUN \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable

WORKDIR /opt

# Install MXCuBE3
COPY debian-install.sh /opt/debian-install.sh
RUN cd /opt && chmod +x debian-install.sh && ./debian-install.sh

COPY mxcube /usr/local/bin/
COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 8090 8081 5901
