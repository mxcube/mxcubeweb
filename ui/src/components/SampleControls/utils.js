import { useSelector } from 'react-redux';

export function useShowControl() {
  return useSelector((state) =>
    state.uiproperties.sample_view_video_controls.components
      .filter((c) => c.show)
      .map((c) => c.id),
  );
}

export function download(filename, url) {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;

  document.body.append(anchor);
  anchor.click();

  URL.revokeObjectURL(anchor.href);
  anchor.remove();
}
