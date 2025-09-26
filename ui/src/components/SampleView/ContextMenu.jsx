import { Dropdown } from 'react-bootstrap';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';

import { showErrorPanel } from '../../actions/general';
import { updateTask } from '../../actions/queue';
import {
  abortCentring,
  acceptCentring,
  add2DPoint,
  addShape,
  deleteShape,
  measureDistance,
  moveToBeam,
  moveToPoint,
  showContextMenu,
  stopClickCentring,
  toggleDrawGrid,
} from '../../actions/sampleview';
import { showTaskForm } from '../../actions/taskForm';
import { getLastUsedParameters } from '../Tasks/fields';

const BESPOKE_TASK_NAMES = new Set([
  'datacollection',
  'characterisation',
  'xrf_spectrum',
  'energy_scan',
  'mesh',
  'helical',
  'workflow',
  'interleaved',
]);

export default function ContextMenu(props) {
  const { getControlAvailability } = props;
  const defaultParameters = useSelector(
    (state) => state.taskForm.defaultParameters,
  );
  const workflows = useSelector((state) => state.workflow.workflows);
  const enableNativeMesh = useSelector((state) => state.general.useNativeMesh);
  const enable2DPoints = useSelector((state) => state.general.enable2DPoints);
  const availableMethods = new Set(Object.keys(defaultParameters));
  const sampleID = useSelector((state) => state.queue.currentSampleID);
  const sampleData = useSelector(
    (state) => state.sampleGrid.sampleList[sampleID],
  );
  const { clickCentring } = useSelector((state) => state.sampleview);
  const groupFolder = useSelector((state) => state.queue.groupFolder);
  const contextMenu = useSelector((state) => state.contextMenu);
  const { sampleViewX, sampleViewY, shape, pageX, pageY, show } = contextMenu;

  const dispatch = useDispatch();

  // eslint-disable-next-line complexity
  function menuOptions() {
    const generalTaskNames = Object.keys(defaultParameters).filter(
      (tname) => !BESPOKE_TASK_NAMES.has(tname),
    );

    const genericTasks = {
      point: [],
      line: [],
      grid: [],
      none: [],
    };

    generalTaskNames.forEach((tname) => {
      const task = defaultParameters[tname];

      if (task.requires.includes('point')) {
        genericTasks.point.push({
          text: task.name,
          action: () =>
            showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }

      if (task.requires.includes('line')) {
        genericTasks.line.push({
          text: task.name,
          action: () =>
            showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }

      if (task.requires.includes('grid')) {
        genericTasks.grid.push({
          text: task.name,
          action: () =>
            showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }

      if (task.requires.includes('no_shape')) {
        genericTasks.none.push({
          text: task.name,
          action: () =>
            showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }

      if (task.requires.includes('no_shape_2d')) {
        genericTasks.none.push({
          text: task.name,
          action: () =>
            createPointAndShowModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }
    });

    Object.values(workflows).forEach((wf) => {
      if (wf.requires.includes('point')) {
        if (wf.wfpath === 'Gphl') {
          genericTasks.point.push({
            text: wf.wfname,
            action: () => showModal('GphlWorkflow', wf),
            key: `wf-${wf.wfname}`,
          });
        } else {
          genericTasks.point.push({
            text: wf.wfname,
            action: () => showModal('Workflow', wf),
            key: `wf-${wf.wfname}`,
          });
        }
      } else if (wf.requires.includes('line')) {
        genericTasks.line.push({
          text: wf.wfname,
          action: () => createLine('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      } else if (wf.requires.includes('grid')) {
        genericTasks.grid.push({
          text: wf.wfname,
          action: () => showModal('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      } else {
        genericTasks.none.push({
          text: wf.wfname,
          action: () => showModal('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      }
    });

    return {
      SAVED: [
        availableMethods.has('datacollection')
          ? {
              text: 'Add Datacollection',
              action: () => showModal('DataCollection'),
              key: 'datacollection',
            }
          : {},
        availableMethods.has('characterisation')
          ? {
              text: 'Add Characterisation',
              action: () => showModal('Characterisation'),
              key: 'characterisation',
            }
          : {},
        availableMethods.has('xrf_spectrum')
          ? {
              text: 'Add XRF Scan',
              action: () => showModal('xrf_spectrum'),
              key: 'xrf_spectrum',
            }
          : {},
        availableMethods.has('energy_scan')
          ? {
              text: 'Add Energy Scan',
              action: () => showModal('energy_scan'),
              key: 'energy_scan',
            }
          : {},
        {
          text: 'Go to Point',
          action: () => {
            dispatch(moveToPoint(shape.id));
          },
          key: 5,
        },
        {
          text: 'divider',
          key: 6,
        },
        ...genericTasks.point,
        genericTasks.point.length > 0 ? { text: 'divider', key: 7 } : {},
        { text: 'Delete Point', action: () => removeShape(), key: 8 },
      ],
      TMP: [
        availableMethods.has('datacollection')
          ? {
              text: 'Add Datacollection',
              action: () => showModal('DataCollection'),
              key: 'datacollection',
            }
          : {},
        availableMethods.has('characterisation')
          ? {
              text: 'Add Characterisation',
              action: () => showModal('Characterisation'),
              key: 'characterisation',
            }
          : {},
        availableMethods.has('xrf_spectrum')
          ? {
              text: 'Add XRF Scan',
              action: () => showModal('xrf_spectrum'),
              key: 'xrf_spectrum',
            }
          : {},
        availableMethods.has('energy_scan')
          ? {
              text: 'Add Energy Scan',
              action: () => showModal('energy_scan'),
              key: 'energy_scan',
            }
          : {},
        { text: 'divider', key: 5 },
        ...genericTasks.point,
        genericTasks.point.length > 0 ? { text: 'divider', key: 6 } : {},
        { text: 'Save Point', action: () => savePoint(), key: 7 },
        { text: 'Delete Point', action: () => removeShape(), key: 8 },
      ],
      GROUP: [
        availableMethods.has('datacollection')
          ? {
              text: 'Add Datacollections',
              action: () => showModal('DataCollection'),
              key: 'datacollection',
            }
          : {},
        availableMethods.has('characterisation')
          ? {
              text: 'Add Characterisations',
              action: () => showModal('Characterisation'),
              key: 'characterisation',
            }
          : {},
        ...genericTasks.point,
      ],
      HELICAL: [
        availableMethods.has('datacollection')
          ? {
              text: 'Add Datacollections',
              action: () => showModal('DataCollection'),
              key: 'datacollection',
            }
          : {},
        availableMethods.has('characterisation')
          ? {
              text: 'Add Characterisations',
              action: () => showModal('Characterisation'),
              key: 'characterisation',
            }
          : {},
        availableMethods.has('helical')
          ? {
              text: 'Add Helical Scan',
              action: () => createLine('Helical'),
              key: 'helical',
            }
          : {},
        {
          text: 'Add Line',
          action: () => createLineOnCanvas(shape.id),
          key: 'create_line',
        },
        ...genericTasks.line,
      ],
      LINE: [
        availableMethods.has('helical')
          ? {
              text: 'Add Helical Scan',
              action: () => showModal('Helical'),
              key: 'helical',
            }
          : {},
        ...genericTasks.line,
        genericTasks.line.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete Line', action: () => removeShape(), key: 4 },
      ],
      GridGroup: [{ text: 'Save Grid', action: () => saveGrid(), key: 1 }],
      GridGroupSaved: [
        enableNativeMesh
          ? {
              text: 'Mesh Scan',
              action: () => showModal('Mesh'),
              key: 'mesh_scan',
            }
          : {},
        {
          text: 'Centring Point on Cell',
          action: () => {
            const { cellCenter } = shape;
            dispatch(add2DPoint(cellCenter[0], cellCenter[1], 'SAVED'));
          },
          key: 5,
        },
        { text: 'divider', key: 2 },
        ...genericTasks.grid,
        genericTasks.grid.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete', action: () => removeShape(), key: 4 },
      ],
      NONE: [
        {
          text: 'Go to Beam',
          action: () => {
            dispatch(moveToBeam(sampleViewX, sampleViewY));
          },
          key: 1,
        },
        {
          text: 'Measure Distance',
          action: () => {
            dispatch(measureDistance(true));
          },
          key: 2,
        },
        getControlAvailability('draw_grid') && {
          text: 'Draw Grid',
          action: () => {
            dispatch(toggleDrawGrid());
          },
          key: 3,
        },
        ...(enable2DPoints
          ? [
              { text: 'divider', key: 4 },
              availableMethods.has('datacollection')
                ? {
                    text: 'Data Collection (Limited OSC)',
                    action: () => createPointAndShowModal('DataCollection'),
                    key: 5,
                  }
                : {},
              availableMethods.has('characterisation')
                ? {
                    text: 'Characterisation (1 Image)',
                    action: () =>
                      createPointAndShowModal('Characterisation', {
                        num_imags: 1,
                      }),
                    key: 6,
                  }
                : {},
              {
                text: 'Create 2D Point',
                action: () => createTwoDPoint(),
                key: 7,
              },
            ]
          : []),
        { text: 'divider', key: 8 },
        ...genericTasks.none,
      ],
    };
  }

  function showModal(modalName, extraParams = {}, _shape = null) {
    if (clickCentring) {
      dispatch(stopClickCentring());
      dispatch(acceptCentring());
    }

    if (!sampleData) {
      dispatch(
        showErrorPanel(
          true,
          'There is no sample mounted, cannot collect data.',
        ),
      );

      return;
    }

    const sid = _shape ? _shape.id : shape?.id;
    if (Array.isArray(sid)) {
      // we remove any line
      // in case we have selected (by drawing a box) two points
      // that already have a line [P1, P2, L1]
      // we do not want to add a DC/Char to a line

      const points = sid.filter((x) => x.match(/P*/u)[0]);
      const containsPoints = points.length > 0;
      const lines = sid.filter((x) => x.match(/L*/u)[0]);
      const containsLine = lines.length > 0;

      if (containsPoints && containsLine) {
        lines.forEach((x) => {
          sid.splice(sid.indexOf(x), 1);
        });
      }
    }

    const type =
      modalName === 'Generic' ? extraParams.type : modalName.toLowerCase();
    const name =
      modalName === 'Generic'
        ? defaultParameters[type].name
        : modalName.toLowerCase();
    let params =
      type in defaultParameters ? defaultParameters[type].acq_parameters : {};

    params = getLastUsedParameters(type, params);

    const [cell_count, numRows, numCols] = shape?.gridData
      ? [
          shape.gridData.numCols * shape.gridData.numRows,
          shape.gridData.numRows,
          shape.gridData.numCols,
        ]
      : ['none', 0, 0];

    dispatch(
      showTaskForm(
        modalName,
        [sampleID],
        {
          parameters: {
            ...params,
            ...extraParams,
            prefix: sampleData.defaultPrefix,
            name,
            subdir: `${groupFolder}${sampleData.defaultSubDir}`,
            cell_count,
            numRows,
            numCols,
          },
          type,
        },
        sid,
      ),
    );
  }

  function createLineOnCanvas(refs) {
    dispatch(addShape({ t: 'L', refs }));
  }

  function savePoint() {
    if (clickCentring) {
      dispatch(stopClickCentring());
    }

    dispatch(acceptCentring());

    // associate the newly saved shape to an existing task with -1 shape.
    // Fixes issues when the task is added before a shape
    const { tasks } = sampleData;
    if (tasks?.length > 0) {
      tasks.forEach((task) => {
        const { parameters } = task;
        if (parameters.shape === -1) {
          parameters.shape = shape.id;
          dispatch(
            updateTask(sampleData.sampleID, task.taskIndex, parameters, false),
          );
        }
      });
    }
  }

  function removeShape() {
    if (clickCentring) {
      dispatch(abortCentring());
    }

    dispatch(deleteShape(shape.id));
  }

  function saveGrid() {
    const { gridData } = shape;
    dispatch(addShape({ t: 'G', ...gridData }));
    dispatch(toggleDrawGrid());
  }

  async function createPointAndShowModal(name, extraParams = {}) {
    const new2DPoint = await dispatch(
      add2DPoint(sampleViewX, sampleViewY, 'SAVED'),
    );

    showModal(name, extraParams, new2DPoint);
  }

  function createTwoDPoint() {
    dispatch(add2DPoint(sampleViewX, sampleViewY, 'SAVED'));
  }

  async function createLine(modal, wf = {}) {
    const sid = shape.id;

    const lines = sid.filter((x) => x.match(/L*/u)[0]);
    const containsLine = lines.length > 0;

    if (containsLine) {
      // e.g. [P1, P2, L1]
      lines.map((x) => sid.splice(sid.indexOf(x), 1));
    }

    const newLine = await dispatch(addShape({ t: 'L', refs: shape.id }));
    showModal(modal, wf, newLine);
  }

  const options = menuOptions();
  const optionsList = shape && sampleID ? options[shape.type] : options.NONE;

  return createPortal(
    <Dropdown
      className="position-absolute"
      style={{ top: `${pageY}px`, left: `${pageX}px` }}
      role="menu"
      show={show}
      autoClose
      onToggle={(nextShow) => {
        if (!nextShow) {
          // Hide menu when clicking outside or selecting option
          dispatch(showContextMenu(false));
        }
      }}
    >
      <Dropdown.Menu
        rootCloseEvent="mousedown" // faster than `click`
      >
        {optionsList
          .filter((type) => !!type.text)
          .map((type) =>
            type.text === 'divider' ? (
              <Dropdown.Divider key={`${type.key}_${type.text}`} />
            ) : (
              <Dropdown.Item
                key={`${type.key}_${type.text}`}
                onClick={type.action}
              >
                {type.text}
              </Dropdown.Item>
            ),
          )}
      </Dropdown.Menu>
    </Dropdown>,
    document.body,
  );
}
