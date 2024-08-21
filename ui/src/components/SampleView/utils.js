export function downloadImage(blob, download_name) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', download_name);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
