import React from 'react';

export default class ContextMenu extends React.Component {

  constructor(props) {
    super(props);
    this.toggleDrawGrid = this.toggleDrawGrid.bind(this);
    this.deleteGrid = this.deleteGrid.bind(this);
    this.menuOptions = this.menuOptions.bind(this);
    this.startWorkflow = this.startWorkflow.bind(this);
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

    const options = {
      SAVED: [
        { text: 'Add Characterisation', action: () => this.showModal('Characterisation'), key: 1 },
        { text: 'Add Datacollection', action: () => this.showModal('DataCollection'), key: 2 },
        { text: 'Go To Point', action: () => this.goToPoint(), key: 3 },
        { text: 'Delete Point', action: () => this.removeObject(), key: 4 },
      ],
      TMP: [
        { text: 'Save Point', action: () => this.savePoint(), key: 1 },
        { text: 'Delete Point', action: () => this.removeObject(), key: 2 }
      ],
      GROUP: [
        { text: 'Add Helical Scan', action: () => this.createLine(), key: 1 }
      ],
      LINE: [
        { text: 'Delete Line', action: () => this.removeLine(), key: 1 }
      ],
      GridGroup: [
        { text: 'Save Grid', action: () => this.saveGrid(), key: 1 }
      ],
      GridGroupSaved: [
        { text: 'Delete', action: () => this.deleteGrid(), key: 1 }
      ],
      NONE: [
        { text: 'Go To Beam', action: () => this.goToBeam(), key: 1 },
        { text: 'Measure Distance', action: () => this.measureDistance(), key: 2 },
        { text: 'Draw Grid', action: () => this.toggleDrawGrid(), key: 3 }
      ]
    };

    Object.values(this.props.workflows).forEach((wf) => {
      if (wf.requires === 'point') {
        workflowTasks.point.push({ text: wf.wfname,
                                   action: () => this.startWorkflow(wf),
                                   key: `wf-${wf.wfname}` });
      } else if (wf.requires === 'line') {
        workflowTasks.line.push({ text: wf.wfname,
                                  action: () => this.startWorkflow(wf),
                                  key: `wf-${wf.wfname}` });
      } else if (wf.requires === 'grid') {
        workflowTasks.grid.push({ text: wf.wfname,
                                  action: () => this.startWorkflow(wf),
                                  key: `wf-${wf.wfname}` });
      } else if (wf.requires === '') {
        workflowTasks.none.push({ text: wf.wfname,
                                  action: () => this.startWorkflow(wf),
                                  key: `wf-${wf.wfname}` });
      }
    });

    options.SAVED = options.SAVED.concat(workflowTasks.point);
    options.LINE = options.LINE.concat(workflowTasks.line);
    options.GridGroupSaved = options.GridGroupSaved.concat(workflowTasks.grid);
    options.NONE = options.NONE.concat(workflowTasks.none);

    return options;
  }

  startWorkflow(wf) {
    console.log(wf);
    this.showModal('Workflow', wf);
    this.props.sampleActions.showContextMenu(false);
  }

  showModal(modalName, wf = {}) {
    const { sampleID, defaultParameters, shape, sampleData } = this.props;
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
      shape.id
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
    this.props.sampleActions.sendSavePoint(this.props.shape.id);
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

  removeObject() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendDeletePoint(this.props.shape.id);
  }

  measureDistance() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.measureDistance(true);
  }

  toggleDrawGrid() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.toggleDrawGrid();
  }

  deleteGrid() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.deleteGrid(this.props.shape.obj.id);
  }

  saveGrid() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.addGrid(this.props.shape.gridData);
    this.props.sampleActions.toggleDrawGrid();
  }

  createLine() {
    const { shape } = this.props;
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.addLine(shape.id.p1, shape.id.p2);
    this.showModal('Helical');
  }

  removeLine() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.deleteLine(this.props.shape.id);
  }

  hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
  }

  listOptions(type) {
    return (
      <li key={type.key}><a onClick={type.action}>{type.text}</a></li>
    );
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
