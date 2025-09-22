# Changelog

`mxcubeweb` project change log. This file outlines significant and/or breaking changes that
are important to be share between developers.

## [4.521.0] - 2025-17-09 - PR1865

This change was done in PR 1865: https://github.com/mxcube/mxcubeweb/pull/1865

The internal MJPEG streamer was removed. Use the video-streamer project
for handling video streams. See: https://github.com/mxcube/video-streamer

### Removed

- Internal MJPEG streamer
- Option `USE_EXTERNAL_STREAMER` from `server.yaml`
