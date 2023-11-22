/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { getLastUsedParameters } from '../Tasks/fields';

// eslint-disable-next-line react/no-unsafe
export default class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.toggleDrawGrid = this.toggleDrawGrid.bind(this);
    this.menuOptions = this.menuOptions.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.show) {
      this.showContextMenu(nextProps.x, nextProps.y);
    } else {
      this.hideContextMenu();
    }
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  menuOptions() {
    const bespokeTaskNames = new Set([
      'datacollection',
      'characterisation',
      'xrf_spectrum',
      'energy_scan',
      'mesh',
      'helical',
      'workflow',
      'interleaved',
    ]);
    const generalTaskNames = Object.keys(
      this.props.taskForm.defaultParameters,
    ).filter((tname) => !bespokeTaskNames.has(tname));

    const genericTasks = {
      point: [],
      line: [],
      grid: [],
      none: [],
    };
    let twoDPoints = [];

    if (this.props.enable2DPoints) {
      twoDPoints = [
        { text: 'divider', key: 4 },
        {
          text: 'Data Collection (Limited OSC)',
          action: () => this.createPointAndShowModal('DataCollection'),
          key: 5,
        },
        {
          text: 'Characterisation (1 Image)',
          action: () =>
            this.createPointAndShowModal('Characterisation', { num_imags: 1 }),
          key: 6,
        },
      ];
    }

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
          text: 'Go To Point',
          action: () => this.goToPoint(),
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
        {
          text: 'Centring Point on cell',
          action: () => this.createCollectionOnCell(),
          key: 5,
        },
        { text: 'divider', key: 2 },
        ...genericTasks.grid,
        genericTasks.grid.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete', action: () => this.removeShape(), key: 4 },
      ],
      NONE: [
        { text: 'Go To Beam', action: () => this.goToBeam(), key: 1 },
        {
          text: 'Measure Distance',
          action: () => this.measureDistance(),
          key: 2,
        },
        this.props.getControlAvailability('draw_grid') && {
          text: 'Draw Grid',
          action: () => this.toggleDrawGrid(),
          key: 3,
        },
        ...twoDPoints,
        { text: 'divider', key: 7 },
        ...genericTasks.none,
        genericTasks.grid.none > 0 ? { text: 'divider', key: 7 } : {},
      ],
    };

    if (this.props.enableNativeMesh) {
      options.GridGroupSaved.unshift({
        text: 'Mesh Scan',
        action: () => this.showModal('Mesh'),
        key: 'mesh_scan',
      });
    }

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

    const sid = _shape ? _shape.id : shape.id;
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

    if (this.props.clickCentring) {
      this.props.sampleViewActions.stopClickCentring();
      this.props.sampleViewActions.sendAcceptCentring();
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
          cell_count: shape.gridData
            ? shape.gridData.numCols * shape.gridData.numRows
            : 'none',
          numRows: shape.gridData ? shape.gridData.numRows : 0,
          numCols: shape.gridData ? shape.gridData.numCols : 0,
        },
        type,
      },
      sid,
    );
    this.hideContextMenu();
    this.props.sampleViewActions.showContextMenu(false);
  }

  createCollectionOnCell() {
    const { cellCenter } = this.props.shape;
    this.createPoint(cellCenter[0], cellCenter[1]);
    this.props.sampleViewActions.showContextMenu(false);
  }

  showContextMenu(x, y) {
    const contextMenu = document.querySelector('#contextMenu');
    if (contextMenu) {
      contextMenu.style.top = `${y + 140}px`;
      contextMenu.style.left = `${x + 170}px`;
      contextMenu.style.display = 'block';
    }
  }

  createPoint(x, y, cb = null) {
    this.props.sampleViewActions.sendAddShape(
      { screenCoord: [x, y], t: '2DP', state: 'SAVED' },
      cb,
    );
  }

  savePoint() {
    if (this.props.clickCentring) {
      this.props.sampleViewActions.stopClickCentring();
    }

    this.props.sampleViewActions.sendAcceptCentring();
    // associate the newly saved shape to an existing task with -1 shape.
    // Fixes issues when the task is added before a shape
    const { tasks } = this.props.sampleData;
    if (tasks.length > 0) {
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

    this.props.sampleViewActions.showContextMenu(false);
  }

  goToPoint() {
    this.props.sampleViewActions.showContextMenu(false);
    this.props.sampleViewActions.sendGoToPoint(this.props.shape.id);
  }

  goToBeam() {
    const { x, y, imageRatio } = this.props;
    this.props.sampleViewActions.showContextMenu(false);
    this.props.sampleViewActions.sendGoToBeam(x / imageRatio, y / imageRatio);
  }

  removeShape() {
    if (this.props.clickCentring) {
      this.props.sampleViewActions.sendAbortCentring();
    }

    // eslint-disable-next-line promise/catch-or-return
    this.props.sampleViewActions
      .sendDeleteShape(this.props.shape.id)
      // eslint-disable-next-line promise/prefer-await-to-then
      .then(() => {
        this.props.sampleViewActions.showContextMenu(false);
      });
  }

  measureDistance() {
    this.props.sampleViewActions.showContextMenu(false);
    this.props.sampleViewActions.measureDistance(true);
  }

  toggleDrawGrid() {
    this.props.sampleViewActions.showContextMenu(false);
    this.props.sampleViewActions.toggleDrawGrid();
  }

  saveGrid() {
    this.props.sampleViewActions.showContextMenu(false);

    const gd = { ...this.props.shape.gridData };
    this.props.sampleViewActions.sendAddShape({ t: 'G', ...gd });
    this.props.sampleViewActions.toggleDrawGrid();
  }

  createPointAndShowModal(name, extraParams = {}) {
    const { x, y, imageRatio } = this.props;
    this.props.sampleViewActions.showContextMenu(false);
    this.createPoint(x / imageRatio, y / imageRatio, (shape) =>
      this.showModal(name, {}, shape, extraParams),
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

    this.props.sampleViewActions.showContextMenu(false);
    this.props.sampleViewActions.sendAddShape(
      { t: 'L', refs: shape.id },
      (s) => {
        this.showModal(modal, wf, s);
      },
    );
  }

  hideContextMenu() {
    const ctxMenu = document.querySelector('#contextMenu');
    if (ctxMenu) {
      ctxMenu.style.display = 'none';
    }
  }

  listOptions(type) {
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
    const menuOptions = this.menuOptions();
    let optionList = [];

    if (this.props.sampleID !== undefined) {
      optionList = menuOptions[this.props.shape.type].map(this.listOptions);
    } else {
      optionList = menuOptions.NONE.map(this.listOptions);
    }
    return (
      <Dropdown.Menu show id="contextMenu" role="menu">
        {optionList}
      </Dropdown.Menu>
    );
  }
}
