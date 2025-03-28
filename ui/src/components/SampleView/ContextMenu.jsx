import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { createPortal } from 'react-dom';

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

export default class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.menuOptions = this.menuOptions.bind(this);
  }

  menuOptions() {
    const generalTaskNames = Object.keys(
      this.props.taskForm.defaultParameters,
    ).filter((tname) => !BESPOKE_TASK_NAMES.has(tname));

    const genericTasks = {
      point: [],
      line: [],
      grid: [],
      none: [],
    };

    generalTaskNames.forEach((tname) => {
      const task = this.props.taskForm.defaultParameters[tname];

      if (task.requires.includes('point')) {
        genericTasks.point.push({
          text: task.name,
          action: () =>
            this.showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }

      if (task.requires.includes('line')) {
        genericTasks.line.push({
          text: task.name,
          action: () =>
            this.showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }

      if (task.requires.includes('grid')) {
        genericTasks.grid.push({
          text: task.name,
          action: () =>
            this.showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }

      if (task.requires.includes('no_shape')) {
        genericTasks.none.push({
          text: task.name,
          action: () =>
            this.showModal('Generic', {
              type: tname,
            }),
          key: `${task.name}`,
        });
      }
    });

    Object.values(this.props.workflows).forEach((wf) => {
      if (wf.requires.includes('point')) {
        if (wf.wfpath === 'Gphl') {
          genericTasks.point.push({
            text: wf.wfname,
            action: () => this.showModal('GphlWorkflow', wf),
            key: `wf-${wf.wfname}`,
          });
        } else {
          genericTasks.point.push({
            text: wf.wfname,
            action: () => this.showModal('Workflow', wf),
            key: `wf-${wf.wfname}`,
          });
        }
      } else if (wf.requires.includes('line')) {
        genericTasks.line.push({
          text: wf.wfname,
          action: () => this.createLine('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      } else if (wf.requires.includes('grid')) {
        genericTasks.grid.push({
          text: wf.wfname,
          action: () => this.showModal('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      } else {
        genericTasks.none.push({
          text: wf.wfname,
          action: () => this.showModal('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      }
    });

    const options = {
      SAVED: [
        {
          text: 'Add Datacollection',
          action: () => this.showModal('DataCollection'),
          key: 'datacollection',
        },
        {
          text: 'Add Characterisation',
          action: () => this.showModal('Characterisation'),
          key: 'characterisation',
        },
        {
          text: 'Add XRF Scan',
          action: () => this.showModal('xrf_spectrum'),
          key: 'xrf_spectrum',
        },
        {
          text: 'Add Energy Scan',
          action: () => this.showModal('energy_scan'),
          key: 'energy_scan',
        },
        {
          text: 'Go to Point',
          action: () => {
            this.props.sampleViewActions.moveToPoint(this.props.shape.id);
          },
          key: 5,
        },
        {
          text: 'divider',
          key: 6,
        },
        ...genericTasks.point,
        genericTasks.point.length > 0 ? { text: 'divider', key: 7 } : {},
        { text: 'Delete Point', action: () => this.removeShape(), key: 8 },
      ],
      TMP: [
        {
          text: 'Add Datacollection',
          action: () => this.showModal('DataCollection'),
          key: 'datacollection',
        },
        {
          text: 'Add Characterisation',
          action: () => this.showModal('Characterisation'),
          key: 'characterisation',
        },
        {
          text: 'Add XRF Scan',
          action: () => this.showModal('xrf_spectrum'),
          key: 'xrf_spectrum',
        },
        {
          text: 'Add Energy Scan',
          action: () => this.showModal('energy_scan'),
          key: 'energy_scan',
        },
        { text: 'divider', key: 5 },
        ...genericTasks.point,
        genericTasks.point.length > 0 ? { text: 'divider', key: 6 } : {},
        { text: 'Save Point', action: () => this.savePoint(), key: 7 },
        { text: 'Delete Point', action: () => this.removeShape(), key: 8 },
      ],
      GROUP: [
        {
          text: 'Add Datacollections',
          action: () => this.showModal('DataCollection'),
          key: 'datacollection',
        },
        {
          text: 'Add Characterisations',
          action: () => this.showModal('Characterisation'),
          key: 'characterisation',
        },
        ...genericTasks.point,
      ],
      HELICAL: [
        {
          text: 'Add Datacollections',
          action: () => this.showModal('DataCollection'),
          key: 'datacollection',
        },
        {
          text: 'Add Characterisations',
          action: () => this.showModal('Characterisation'),
          key: 'characterisation',
        },
        {
          text: 'Add Helical Scan',
          action: () => this.createLine('Helical'),
          key: 'helical',
        },
        ...genericTasks.line,
      ],
      LINE: [
        {
          text: 'Add Helical Scan',
          action: () => this.showModal('Helical'),
          key: 'helical',
        },
        ...genericTasks.line,
        genericTasks.line.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete Line', action: () => this.removeShape(), key: 4 },
      ],
      GridGroup: [{ text: 'Save Grid', action: () => this.saveGrid(), key: 1 }],
      GridGroupSaved: [
        ...(this.props.enableNativeMesh
          ? [
              {
                text: 'Mesh Scan',
                action: () => this.showModal('Mesh'),
                key: 'mesh_scan',
              },
            ]
          : []),
        {
          text: 'Centring Point on Cell',
          action: () => {
            const { cellCenter } = this.props.shape;
            this.props.sampleViewActions.add2DPoint(
              cellCenter[0],
              cellCenter[1],
              'SAVED',
            );
          },
          key: 5,
        },
        { text: 'divider', key: 2 },
        ...genericTasks.grid,
        genericTasks.grid.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete', action: () => this.removeShape(), key: 4 },
      ],
      NONE: [
        {
          text: 'Go to Beam',
          action: () => {
            const { sampleViewX, sampleViewY } = this.props;
            this.props.sampleViewActions.moveToBeam(sampleViewX, sampleViewY);
          },
          key: 1,
        },
        {
          text: 'Measure Distance',
          action: () => {
            this.props.sampleViewActions.measureDistance(true);
          },
          key: 2,
        },
        this.props.getControlAvailability('draw_grid') && {
          text: 'Draw Grid',
          action: () => {
            this.props.sampleViewActions.toggleDrawGrid();
          },
          key: 3,
        },
        ...(this.props.enable2DPoints
          ? [
              { text: 'divider', key: 4 },
              {
                text: 'Data Collection (Limited OSC)',
                action: () => this.createPointAndShowModal('DataCollection'),
                key: 5,
              },
              {
                text: 'Characterisation (1 Image)',
                action: () =>
                  this.createPointAndShowModal('Characterisation', {
                    num_imags: 1,
                  }),
                key: 6,
              },
              {
                text: 'Create 2D Point',
                action: () => this.createTwoDPoint(),
                key: 7,
              },
            ]
          : []),
        { text: 'divider', key: 8 },
        ...genericTasks.none,
      ],
    };

    Object.keys(this.props.availableMethods).forEach((key) => {
      if (!this.props.availableMethods[key]) {
        Object.keys(options).forEach((k) => {
          options[k] = options[k].filter((e) => {
            let res = true;
            if (Object.keys(this.props.availableMethods).includes(e.key)) {
              res = this.props.availableMethods[e.key];
            }
            return res;
          });
        });
      }
    });

    return options;
  }

  showModal(modalName, extraParams = {}, _shape = null) {
    const { sampleID, shape, sampleData, defaultParameters } = this.props;

    if (this.props.clickCentring) {
      this.props.sampleViewActions.stopClickCentring();
      this.props.sampleViewActions.acceptCentring();
    }

    if (!sampleData) {
      this.props.showErrorPanel(
        true,
        'There is no sample mounted, cannot collect data.',
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
        lines.map((x) => sid.splice(sid.indexOf(x), 1));
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

    this.props.showForm(
      modalName,
      [sampleID],
      {
        parameters: {
          ...params,
          ...extraParams,
          prefix: sampleData.defaultPrefix,
          name,
          subdir: `${this.props.groupFolder}${sampleData.defaultSubDir}`,
          cell_count,
          numRows,
          numCols,
        },
        type,
      },
      sid,
    );
  }

  savePoint() {
    if (this.props.clickCentring) {
      this.props.sampleViewActions.stopClickCentring();
    }

    this.props.sampleViewActions.acceptCentring();

    // associate the newly saved shape to an existing task with -1 shape.
    // Fixes issues when the task is added before a shape
    const { tasks } = this.props.sampleData;
    if (tasks?.length > 0) {
      tasks.forEach((task) => {
        const { parameters } = task;
        if (parameters.shape === -1) {
          parameters.shape = this.props.shape.id;
          this.props.updateTask(
            this.props.sampleData.sampleID,
            task.taskIndex,
            parameters,
            false,
          );
        }
      });
    }
  }

  removeShape() {
    if (this.props.clickCentring) {
      this.props.sampleViewActions.abortCentring();
    }

    this.props.sampleViewActions.deleteShape(this.props.shape.id);
  }

  saveGrid() {
    const { gridData } = this.props.shape;
    this.props.sampleViewActions.addShape({ t: 'G', ...gridData });
    this.props.sampleViewActions.toggleDrawGrid();
  }

  createPointAndShowModal(name, extraParams = {}) {
    const { sampleViewX, sampleViewY } = this.props;

    this.props.sampleViewActions.add2DPoint(
      sampleViewX,
      sampleViewY,
      'SAVED',
      (shape) => this.showModal(name, {}, shape, extraParams),
    );
  }

  createTwoDPoint() {
    const { sampleViewX, sampleViewY } = this.props;

    this.props.sampleViewActions.add2DPoint(
      sampleViewX,
      sampleViewY,
      'SAVED',
      null,
    );
  }

  createLine(modal, wf = {}) {
    const { shape } = this.props;
    const sid = shape.id;

    const lines = sid.filter((x) => x.match(/L*/u)[0]);
    const containsLine = lines.length > 0;

    if (containsLine) {
      // e.g. [P1, P2, L1]
      lines.map((x) => sid.splice(sid.indexOf(x), 1));
    }

    this.props.sampleViewActions.addShape({ t: 'L', refs: shape.id }, (s) => {
      this.showModal(modal, wf, s);
    });
  }

  listOptions(type) {
    if (type.text === undefined) {
      return undefined;
    }

    let el = (
      <Dropdown.Item key={`${type.key}_${type.text}`} onClick={type.action}>
        {type.text}
      </Dropdown.Item>
    );

    if (type.text === 'divider') {
      el = <Dropdown.Divider key={`${type.key}_${type.text}`} />;
    }

    return el;
  }

  render() {
    const { pageX, pageY, show } = this.props;

    const menuOptions = this.menuOptions();
    let optionList = [];

    if (this.props.shape && this.props.sampleID) {
      optionList = menuOptions[this.props.shape.type].map(this.listOptions);
    } else {
      optionList = menuOptions.NONE.map(this.listOptions);
    }

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
            this.props.sampleViewActions.showContextMenu(false);
          }
        }}
      >
        <Dropdown.Menu
          rootCloseEvent="mousedown" // faster than `click`
        >
          {optionList}
        </Dropdown.Menu>
      </Dropdown>,
      document.body,
    );
  }
}
