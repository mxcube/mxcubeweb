export function sampleStateBackground(key) {
  const map = {
    ready_to_execute: 'success',
    harvested: 'info',
    needs_repositionning: 'warning',
    in_puck: 'success',
    on_gonio: 'info',
    mounting: 'warning',
    unmounting: 'warning',
    recovery_puck: 'primary',
    blacklisted: 'danger',
    stuck_on_gripper: 'warning',
    failed: 'danger',
    unknown: 'secondary',
  };

  return map[key] || 'secondary';
}

export function getSampleName(sampleData) {
  let name = sampleData?.proteinAcronym || '';

  if (sampleData?.sampleName && name) {
    name += ` - ${sampleData?.sampleName}`;
  } else {
    name = sampleData?.sampleName || '';
  }

  return name;
}
