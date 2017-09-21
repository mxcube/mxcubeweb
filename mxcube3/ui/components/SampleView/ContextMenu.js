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
    const workflowTasks = { point: [], line: [], grid: [], none: [] };

    Object.values(this.props.workflows).forEach((wf) => {
      if (wf.requires === 'point') {
        workflowTasks.point.push({ text: wf.wfname,
                                   action: () => this.showModal('Workflow', wf),
                                   key: `wf-${wf.wfname}` });
      } else if (wf.requires === 'line') {
        workflowTasks.line.push({ text: wf.wfname,
                                  action: () => this.showModal('Workflow', wf),
                                  key: `wf-${wf.wfname}` });
      } else if (wf.requires === 'grid') {
        workflowTasks.grid.push({ text: wf.wfname,
                                  action: () => this.showModal('Workflow', wf),
                                  key: `wf-${wf.wfname}` });
      } else if (wf.requires === '') {
        workflowTasks.none.push({ text: wf.wfname,
                                  action: () => this.showModal('Workflow', wf),
                                  key: `wf-${wf.wfname}` });
      }
    });

    const options = {
      SAVED: [
        { text: 'Add Datacollection', action: () => this.showModal('DataCollection'), key: 1 },
        { text: 'Add Characterisation', action: () => this.showModal('Characterisation'), key: 2 },
	{ text: 'Add XRF Scan', action: () => this.showModal('XRFScan'), key: 3 },
	{ text: 'Add Energy Scan', action: () => this.showModal('EnergyScan'), key: 4 },
        { text: 'Go To Point', action: () => this.goToPoint(), key: 5 },
        { text: 'divider', key: 6 },
        ...workflowTasks.point,
        workflowTasks.point.length > 0 ? { text: 'divider', key: 26 } : {},
        { text: 'Delete Point', action: () => this.removeShape(), key: 27 },
      ],
      TMP: [
        { text: 'Add Datacollection', action: () => this.showModal('DataCollection'), key: 1 },
        { text: 'Add Characterisation', action: () => this.showModal('Characterisation'), key: 2 },
	{ text: 'Add XRF Scan', action: () => this.showModal('XRFScan'), key: 3 },
	{ text: 'Add Energy Scan', action: () => this.showModal('EnergyScan'), key: 4 },
        { text: 'divider', key: 5 },
        ...workflowTasks.point,
        workflowTasks.point.length > 0 ? { text: 'divider', key: 20 } : {},
        { text: 'Save Point', action: () => this.savePoint(), key: 21 },
        { text: 'Delete Point', action: () => this.removeShape(), key: 22 }
      ],
      GROUP: [
        { text: 'Add Datacollections', action: () => this.showModal('DataCollection'), key: 1 },
        { text: 'Add Characterisations', action: () => this.showModal('Characterisation'), key: 2 },
        ...workflowTasks.point,
      ],
      HELICAL: [
        { text: 'Add Datacollections', action: () => this.showModal('DataCollection'), key: 1 },
        { text: 'Add Characterisations', action: () => this.showModal('Characterisation'), key: 2 },
        { text: 'Add Helical Scan', action: () => this.createLine(), key: 3 },
        ...workflowTasks.point,
      ],
      LINE: [
        ...workflowTasks.line,
        workflowTasks.line.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete Line', action: () => this.removeShape(), key: 4 }
      ],
      GridGroup: [
        { text: 'Save Grid', action: () => this.saveGrid(), key: 1 }
      ],
      GridGroupSaved: [
        { text: 'Mesh Scan', action: () => this.showModal('Mesh'), key: 1 },
        { text: 'Centring Point on cell', action: () => this.createCollectionOnCell(), key: 5 },
        { text: 'divider', key: 2 },
        ...workflowTasks.grid,
        workflowTasks.grid.length > 0 ? { text: 'divider', key: 3 } : {},
        { text: 'Delete', action: () => this.removeShape(), key: 4 }
      ],
      NONE: [
        { text: 'Go To Beam', action: () => this.goToBeam(), key: 1 },
        { text: 'Measure Distance', action: () => this.measureDistance(), key: 2 },
        { text: 'Draw Grid', action: () => this.toggleDrawGrid(), key: 3 },
        workflowTasks.grid.none > 0 ? { text: 'divider', key: 4 } : {},
        ...workflowTasks.none
      ]
    };

    return options;
  }

  showModal(modalName, wf = {}, _shape = null) {
    const { sampleID, defaultParameters, shape, sampleData } = this.props;
    const sid = _shape ? _shape.id : shape.id;

    this.props.showForm(
      modalName,
      [sampleID],
      { parameters:
        { ...defaultParameters[modalName.toLowerCase()],
          ...wf,
          prefix: sampleData.defaultPrefix,
          subdir: sampleData.sampleName,
          cell_count: shape.gridData ? shape.gridData.numCols * shape.gridData.numRows : 'none',
          numRows: shape.gridData ? shape.gridData.numRows : 0,
          numCols: shape.gridData ? shape.gridData.numCols : 0
        }
      },
      sid
    );
    this.hideContextMenu();
    this.props.sampleActions.showContextMenu(false);
  }

  calculateCellCenter(x, y, gridData, imageRatio) {
    let [x0, y0] = gridData.screenCoord;
    let { cellWidth, cellHeight } = gridData;

    x0 = x0 / imageRatio;
    y0 = y0 / imageRatio;
    cellWidth = cellWidth / imageRatio;
    cellHeight = cellHeight / imageRatio;

    const hCell = Math.floor((x - x0) / cellWidth);
    const vCell = Math.floor((y - y0) / cellHeight);
    const xCell = (hCell + 0.5) * cellWidth + x0;
    const yCell = (vCell + 0.5) * cellHeight + y0;
    return [xCell * imageRatio, yCell * imageRatio];
  }

  createCollectionOnCell() {
    const [x, y] = this.calculateCellCenter(this.props.x,
                                            this.props.y,
                                            this.props.shape.gridData,
                                            this.props.imageRatio
                                            );
    this.createPoint(x, y);
    this.props.sampleActions.showContextMenu(false);
  }

  showContextMenu(x, y) {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
      contextMenu.style.top = `${y}px`;
      contextMenu.style.left = `${x + 15}px`;
      contextMenu.style.display = 'block';
    }
  }

  createPoint(x, y) {
    this.props.sampleActions.sendAddShape({ screenCoord: [x, y], t: 'P', state: 'SAVED' });
  }

  savePoint() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.stopClickCentring();
    this.props.sampleActions.sendAcceptCentring();
    this.props.sampleActions.savePointId(this.props.shape.id);
  }

  goToPoint() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendGoToPoint(this.props.shape.id);
  }

  goToBeam() {
    const { x, y, imageRatio } = this.props;
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendGoToBeam(x * imageRatio, y * imageRatio);
  }

  removeShape() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendAbortCentring();
    this.props.sampleActions.sendDeleteShape(this.props.shape.id);
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

    if (this.props.imageRatio !== 1) {
      gd.cellHeight = gd.cellHeight * this.props.imageRatio;
      gd.cellWidth = gd.cellWidth * this.props.imageRatio;
      gd.width = gd.width * this.props.imageRatio;
      gd.height = gd.height * this.props.imageRatio;
      gd.screenCoord[0] = gd.screenCoord[0] * this.props.imageRatio;
      gd.screenCoord[1] = gd.screenCoord[1] * this.props.imageRatio;
    }

    this.props.sampleActions.sendAddShape({ t: 'G', ...gd });
    this.props.sampleActions.toggleDrawGrid();
  }

  createLine() {
    const { shape, savedPointId } = this.props;
    if (savedPointId !== '') {
      // we ensure the order of the line points
      const p1 = shape.id.p1;
      if (savedPointId !== p1) {
        shape.id.p2 = p1;
        shape.id.p1 = savedPointId;
      }
    }
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendAddShape({ t: 'L', refs: [shape.id.p1, shape.id.p2] },
      (s) => {this.showModal('Helical', {}, s);});
  }

  hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
  }

  listOptions(type) {
    let el = (<li key={type.key}><a onClick={type.action}>{type.text}</a></li>);

    if (type.text === 'divider') {
      el = (<li className="divider" />);
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
