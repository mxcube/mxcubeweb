export function setEnergyScanResult(pk, ip, rm) {
  return {
    type: 'SET_ENERGY_SCAN_RESULT',
    pk,
    ip,
    rm,
  };
}
