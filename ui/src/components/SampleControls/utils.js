export function download(filename, url) {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;

  document.body.append(anchor);
  anchor.click();

  URL.revokeObjectURL(anchor.href);
  anchor.remove();
}
