import React from 'react';

export default class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.toggleDrawGrid = this.toggleDrawGrid.bind(this);
    this.menuOptions = this.menuOptions.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.show) {
      this.showContextMenu(nextProps.x, nextProps.y);
    } else {
      this.hideContextMenu();
    }
  }

  menuOptions() {
    const workflowTasks = {
      point: [],
      line: [],
      grid: [],
      none: [],
    };
    let twoDPoints = [];

    if (process.env.use2dCenteredPoints) {
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

    Object.values(this.props.workflows).forEach((wf) => {
      if (wf.requires.includes('point')) {
        if (wf.wfpath === 'Gphl') {
          workflowTasks.point.push({
            text: wf.wfname,
            action: () => this.showModal('GphlWorkflow', wf),
            key: `wf-${wf.wfname}`,
          });
        } else {
          workflowTasks.point.push({
            text: wf.wfname,
            action: () => this.showModal('Workflow', wf),
            key: `wf-${wf.wfname}`,
          });
        }
      } else if (wf.requires.includes('line')) {
        workflowTasks.line.push({
          text: wf.wfname,
          action: () => this.createLine('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      } else if (wf.requires.includes('grid')) {
        workflowTasks.grid.push({
          text: wf.wfname,
          action: () => this.showModal('Workflow', wf),
          key: `wf-${wf.wfname}`,
        });
      } else {
        workflowTasks.none.push({
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
          action: () => this.showModal('XRFScan'),
          key: 'xrf_scan',
        },
        {
          text: 'Add Energy Scan',
          action: () => this.showModal('EnergyScan'),
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
        ...workflowTasks.point,
        workflowTasks.point.length > 0 ? { text: 'divider', key: 7 } : {},
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
          action: () => this.showModal('XRFScan'),
          key: 'xrf_scan',
        },
        {
          text: 'Add Energy Scan',
          action: () => this.showModal('EnergyScan'),
          key: 'energy_scan',
        },
        { text: 'divider', key: 5 },
        ...workflowTasks.point,
        workflowTasks.point.length > 0 ? { text: 'divider', key: 6 } : {},
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
        ...workflowTasks.point,
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
        ...workflowTasks.line,
      ],
      LINE: [
        {
          text: 'Add Helical Scan',
          action: () => this.showModal('Helical'),
          key: 'helical',
        },
        ...workflowTasks.line,
        workflowTasks.line.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete Line', action: () => this.removeShape(), key: 4 },
      ],
      GridGroup: [{ text: 'Save Grid', action: () => this.saveGrid(), key: 1 }],
      GridGroupSaved: [
        {
          text: 'Mesh Scan',
          action: () => this.showModal('Mesh'),
          key: 'mesh_scan',
        },
        {
          text: 'Centring Point on cell',
          action: () => this.createCollectionOnCell(),
          key: 5,
        },
        { text: 'divider', key: 2 },
        ...workflowTasks.grid,
        workflowTasks.grid.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete', action: () => this.removeShape(), key: 4 },
      ],
      NONE: [
        { text: 'Go To Beam', action: () => this.goToBeam(), key: 1 },
        {
          text: 'Measure Distance',
          action: () => this.measureDistance(),
          key: 2,
        },
        { text: 'Draw Grid', action: () => this.toggleDrawGrid(), key: 3 },
        ...twoDPoints,
        { text: 'divider', key: 7 },
        ...workflowTasks.none,
        workflowTasks.grid.none > 0 ? { text: 'divider', key: 7 } : {},
      ],
    };

    Object.keys(this.props.availableMethods).forEach((key) => {
      if (!this.props.availableMethods[key]) {
        Object.keys(options).forEach(
          (k) =>
            (options[k] = options[k].filter((e) => {
              let res = true;
              if (Object.keys(this.props.availableMethods).includes(e.key)) {
                res = this.props.availableMethods[e.key];
              }
              return res;
            }))
        );
      }
    });

    return options;
  }

  showModal(modalName, wf = {}, _shape = null, extraParams = {}) {
    const { sampleID, shape, sampleData, defaultParameters } = this.props;

    Object.assign(defaultParameters, extraParams);

    const sid = _shape ? _shape.id : shape.id;
    if (Array.isArray(sid)) {
      // we remove any line
      // in case we have selected (by drawing a box) two points
      // that already have a line [P1, P2, L1]
      // we do not want to add a DC/Char to a line

      const points = sid.filter((x) => x.match(/P*/)[0]);
      const containsPoints = points.length > 0;
      const lines = sid.filter((x) => x.match(/L*/)[0]);
      const containsLine = lines.length > 0;

      if (containsPoints && containsLine) {
        lines.map((x) => sid.splice(sid.indexOf(x), 1));
      }
    }

    if (this.props.clickCentring) {
      this.props.sampleActions.stopClickCentring();
      this.props.sampleActions.sendAcceptCentring();
    }

    this.props.showForm(
      modalName,
      [sampleID],
      {
        parameters: {
          ...defaultParameters[modalName.toLowerCase()],
          ...wf,
          prefix: sampleData.defaultPrefix,
          subdir: `${this.props.groupFolder}${sampleData.defaultSubDir}`,
          cell_count: shape.gridData
            ? shape.gridData.numCols * shape.gridData.numRows
            : 'none',
          numRows: shape.gridData ? shape.gridData.numRows : 0,
          numCols: shape.gridData ? shape.gridData.numCols : 0,
        },
      },
      sid
    );
    this.hideContextMenu();
    this.props.sampleActions.showContextMenu(false);
  }

  createCollectionOnCell() {
    const { cellCenter } = this.props.shape;
    this.createPoint(cellCenter[0], cellCenter[1]);
    this.props.sampleActions.showContextMenu(false);
  }

  showContextMenu(x, y) {
    const contextMenu = document.querySelector('#contextMenu');
    if (contextMenu) {
      contextMenu.style.top = `${y}px`;
      contextMenu.style.left = `${x + 15}px`;
      contextMenu.style.display = 'block';
    }
  }

  createPoint(x, y, cb = null) {
    this.props.sampleActions.sendAddShape(
      { screenCoord: [x, y], t: '2DP', state: 'SAVED' },
      cb
    );
  }

  savePoint() {
    if (this.props.clickCentring) {
      this.props.sampleActions.stopClickCentring();
    }

    this.props.sampleActions.sendAcceptCentring();
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
            false
          );
        }
      });
    }

    this.props.sampleActions.showContextMenu(false);
  }

  goToPoint() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendGoToPoint(this.props.shape.id);
  }

  goToBeam() {
    const { x, y, imageRatio } = this.props;
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendGoToBeam(x / imageRatio, y / imageRatio);
  }

  removeShape() {
    if (this.props.clickCentring) {
      this.props.sampleActions.sendAbortCentring();
    }

    this.props.sampleActions.sendDeleteShape(this.props.shape.id).then(() => {
      this.props.sampleActions.showContextMenu(false);
    });
  }

  measureDistance() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.measureDistance(true);
  }

  toggleDrawGrid() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.toggleDrawGrid();
  }

  saveGrid() {
    this.props.sampleActions.showContextMenu(false);

    const gd = { ...this.props.shape.gridData };
    this.props.sampleActions.sendAddShape({ t: 'G', ...gd });
    this.props.sampleActions.toggleDrawGrid();
  }

  createPointAndShowModal(name, extraParams = {}) {
    const { x, y, imageRatio } = this.props;
    this.props.sampleActions.showContextMenu(false);
    this.createPoint(x / imageRatio, y / imageRatio, (shape) =>
      this.showModal(name, {}, shape, extraParams)
    );
  }

  createLine(modal, wf = {}) {
    const { shape } = this.props;
    const sid = shape.id;

    const lines = sid.filter((x) => x.match(/L*/)[0]);
    const containsLine = lines.length > 0;

    if (containsLine) {
      // e.g. [P1, P2, L1]
      lines.map((x) => sid.splice(sid.indexOf(x), 1));
    }

    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendAddShape({ t: 'L', refs: shape.id }, (s) => {
      this.showModal(modal, wf, s);
    });
  }

  hideContextMenu() {
    const ctxMenu = document.querySelector('#contextMenu');
    if (ctxMenu) {
      ctxMenu.style.display = 'none';
    }
  }

  listOptions(type) {
    let el = (
      <li key={type.key}>
        <a onClick={type.action}>{type.text}</a>
      </li>
    );

    if (type.text === 'divider') {
      el = <li key={type.key} className="divider" />;
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
      <ul id="contextMenu" className="dropdown-menu" role="menu">
        {optionList}
      </ul>
    );
  }
}
