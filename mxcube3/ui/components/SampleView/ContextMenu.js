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
        { text: 'Go To Point', action: () => this.goToPoint(), key: 4 },
        { text: 'divider', key: 5 },
        ...workflowTasks.point,
        workflowTasks.point.length > 0 ? { text: 'divider', key: 6 } : {},
        { text: 'Delete Point', action: () => this.removeShape(), key: 7 },
      ],
      TMP: [
        { text: 'Add Datacollection', action: () => this.showModal('DataCollection'), key: 1 },
        { text: 'Add Characterisation', action: () => this.showModal('Characterisation'), key: 2 },
        { text: 'divider', key: 3 },
        ...workflowTasks.point,
        workflowTasks.point.length > 0 ? { text: 'divider', key: 6 } : {},
        { text: 'Save Point', action: () => this.savePoint(), key: 4 },
        { text: 'Delete Point', action: () => this.removeShape(), key: 5 }
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
          subdir: sampleData.sampleName
        }
      },
      sid
    );
    this.hideContextMenu();
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

  savePoint() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.stopClickCentring();
    this.props.sampleActions.sendUpdateShape(this.props.shape.id, { state: 'SAVED' });
    this.props.sampleActions.sendAcceptCentring();
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
    this.props.sampleActions.sendAddShape({ t: 'G', ...this.props.shape.gridData });
    this.props.sampleActions.toggleDrawGrid();
  }

  createLine() {
    const { shape } = this.props;
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
