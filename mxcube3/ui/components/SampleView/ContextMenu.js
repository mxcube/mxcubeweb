import React from 'react';

export default class ContextMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      options: {
        SAVED: [
        { text: 'Add Characterisation', action: () => this.showModal('Characterisation'), key: 1 },
        { text: 'Add Datacollection', action: () => this.showModal('DataCollection'), key: 2 },
        { text: 'Go To Point', action: () => this.goToPoint(), key: 3 },
        { text: 'Delete Point', action: () => this.removeObject(), key: 4 }
        ],
        TMP: [
        { text: 'Save Point', action: () => this.savePoint(), key: 1 },
        { text: 'Delete Point', action: () => this.removeObject(), key: 2 }
        ],
        GROUP: [
        { text: 'Draw Line', action: undefined, key: 1 },
        { text: 'Delete Selected (NA)', action: undefined, key: 2 }
        ],
        LINE: [
        { text: 'Add Helical Scan (NA)', action: undefined, key: 1 },
        { text: 'Delete Line', action: () => this.removeObject(), key: 2 }
        ],
        NONE: [
          { text: 'Please mount a sample', action: undefined, key: 1 },
        ]
      }
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.show) {
      this.showContextMenu(nextProps.x, nextProps.y);
    } else {
      this.hideContextMenu();
    }
  }

  showModal(modalName) {
    const { sampleId, defaultParameters, shape, samplesInformation } = this.props;
    const node = samplesInformation[sampleId];
    this.props.showForm(
      modalName,
      [sampleId],
      { parameters:
        { path: node.sampleName,
          ...defaultParameters[modalName.toLowerCase()],
          prefix: `${node.proteinAcronym}-${node.sampleName}`
        }
      },
      shape.id
    );
    this.hideContextMenu();
    this.props.sampleActions.showContextMenu(false);
  }

  showContextMenu(x, y) {
    document.getElementById('contextMenu').style.top = `${y}px`;
    document.getElementById('contextMenu').style.left = `${x}px`;
    document.getElementById('contextMenu').style.display = 'block';
  }

  savePoint() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.stopClickCentring();
    this.props.sampleActions.sendSavePoint(this.props.shape.id);
  }

  goToPoint() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendGoToPoint(this.props.shape.id);
  }

  removeObject() {
    this.props.sampleActions.showContextMenu(false);
    this.props.sampleActions.sendDeletePoint(this.props.shape.id);
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
    let optionList = [];
    if (this.props.sampleId !== undefined) {
      optionList = this.state.options[this.props.shape.type].map(this.listOptions);
    } else {
      optionList = this.state.options.NONE.map(this.listOptions);
    }
    return (
      <ul id="contextMenu" className="dropdown-menu" role="menu">
        {optionList}
      </ul>
    );
  }
}
