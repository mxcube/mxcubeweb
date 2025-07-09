export function showWaitDialog(
  title = 'Please wait',
  message = undefined,
  blocking = false,
  abortFun = undefined,
) {
  return {
    type: 'SHOW_WAIT_DIALOG',
    title,
    message,
    blocking,
    abortFun,
  };
}

export function hideWaitDialog() {
  return {
    type: 'HIDE_WAIT_DIALOG',
  };
}
