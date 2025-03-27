export const PUCK_MENU_ID = 'samples-grid-table-context-menu-puck';

/**
 * Returns menu options for workflow tasks
 *
 * @property {Object} workflows
 *
 * return {array} Array of <Dropdown.Item>
 */
export function getWorkflowMenuOptions(workflows, showWorkflowForm) {
  const workflowTasks = {
    point: [],
    line: [],
    grid: [],
    samplegrid: [],
    none: [],
  };

  Object.values(workflows).forEach((wf) => {
    if (wf.requires.includes('point')) {
      workflowTasks.point.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else if (wf.requires.includes('line')) {
      workflowTasks.line.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else if (wf.requires.includes('grid')) {
      workflowTasks.grid.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else if (wf.requires.includes('samplegrid')) {
      workflowTasks.samplegrid.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else {
      workflowTasks.none.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    }
  });

  return workflowTasks;
}

/**
 * Checks if the two DOMElements el1 and el2 overlap
 *
 * @param {DOMElement} el1
 * @param {DOMElement} el2
 * @return {boolean}
 */
export function checkForOverlap(el1, el2) {
  let result = false;

  if (el2 === null || el1 === null) {
    return false;
  }
  const bounds1 = el1.getBoundingClientRect();
  const bounds2 = el2.getBoundingClientRect();

  const firstIstLeftmost = bounds1.left <= bounds2.left;
  const leftmost = firstIstLeftmost ? bounds1 : bounds2;
  const rightmost = firstIstLeftmost ? bounds2 : bounds1;

  // change to >= if border overlap should count
  if (leftmost.right > rightmost.left) {
    const firstIsTopmost = bounds1.top <= bounds2.top;
    const topmost = firstIsTopmost ? bounds1 : bounds2;
    const bottommost = firstIsTopmost ? bounds2 : bounds1;

    // change to >= if border overlap should count
    result = topmost.bottom > bottommost.top;
  }

  return result;
}

// Helper function to calculate puck colsm value
export function getColsm(singleCell, puckCount) {
  if (singleCell) {
    return puckCount <= 4 ? 3 : puckCount >= 5 ? true : 2;
  }
  return puckCount === 1
    ? 2
    : puckCount === 2
    ? 4
    : puckCount >= 4
    ? 'auto'
    : 6;
}
