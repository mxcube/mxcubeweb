import React from 'react';
import { Panel, Button, OverlayTrigger, Tooltip, Glyphicon, ButtonToolbar } from 'react-bootstrap';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import './SampleChanger.css';
/* eslint-disable react/no-multi-comp */

export class SampleChangerTree extends React.Component {
  render() {
    let titleBackground;

    if (this.props.state === 'READY') {
      titleBackground = 'primary';
    } else if (this.props.state === 'MOVING') {
      titleBackground = 'warning';
    } else {
      titleBackground = 'danger';
    }

    return (<Panel header={this.props.title} bsStyle={titleBackground}>
            {this.props.children}
        </Panel>);
  }
}

export class SampleChangerTreeNode extends React.Component {
  constructor(props) {
    super(props);

    this.selectClicked = this.selectClicked.bind(this);
    this.scanClicked = this.selectClicked.bind(this);
    this.refreshClicked = this.refreshClicked.bind(this);
  }

  getUniqueId() {
    if (SampleChangerTreeNode._uid_count === undefined) {
      SampleChangerTreeNode._uid_count = 0;
    }
    return `SCTreeNodeID${SampleChangerTreeNode._uid_count++}`;
  }

  selectClicked() {
    this.props.select(this.props.label);
  }

  scanClicked() {
    this.props.scan(this.props.label);
  }

  refreshClicked() {
    this.props.refresh();
  }

  render() {
    const inputId = this.getUniqueId();
    const scanTooltip = (
             <Tooltip>Scan</Tooltip>
         );
    const selectTooltip = (
             <Tooltip>Select</Tooltip>
         );
    const refreshTooltip = (
             <Tooltip>Refresh</Tooltip>
         );
    const selectBtnClasses = 'btn btn-xs btn-link custom-btn-color';
    const selectedGlyph = this.props.selected ? 'check' : 'unchecked';
    let select;
    if (this.props.root) {
      select = (<OverlayTrigger placement="top" overlay={refreshTooltip}>
               <span>
                 <Button className={selectBtnClasses} bsSize="xsmall" onClick={this.refreshClicked}>
                   <Glyphicon glyph="refresh" />
                 </Button>
               </span>
             </OverlayTrigger>);
    } else {
      select = (<OverlayTrigger placement="top" overlay={selectTooltip}>
               <span>
                 <Button className={selectBtnClasses} bsSize="xsmall" onClick={this.selectClicked}>
                   <Glyphicon glyph={selectedGlyph} />
                 </Button>
               </span>
             </OverlayTrigger>);
    }
    return (<li className="treeLi">
             <input type="checkbox" className="treeNode" id={inputId} />
             {select}
             <label htmlFor={inputId} className="treeNodeLabel">{this.props.label}</label>
             <OverlayTrigger placement="right" overlay={scanTooltip}>
               <Button bsStyle="default" bsSize="xsmall" onClick={this.scanClicked}>
                 <Glyphicon glyph="qrcode" />
               </Button>
             </OverlayTrigger>
             <ul className="treeUl">
                 {this.props.children}
             </ul>
         </li>);
  }
}

export class SampleChangerTreeItem extends React.Component {
  constructor(props) {
    super(props);
    this.itemClicked = this.itemClicked.bind(this);
    this.state = { allow_control: false };

    this.loadSample = this.loadSample.bind(this);
    this.unloadSample = this.unloadSample.bind(this);
  }

  itemClicked() {
    this.setState({ allow_control: !this.state.allow_control });
  }

  loadSample() {
    this.props.load(this.props.label);
  }

  unloadSample() {
    this.props.unload(this.props.label);
  }

  render() {
    let scControl = '';
    if (this.state.allow_control) {
      scControl = (
        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="xsmall" onClick={this.loadSample}>Load sample</Button>
          <Button bsStyle="primary" bsSize="xsmall" onClick={this.unloadSample}>Unload here</Button>
        </ButtonToolbar>
      );
    }
    const dm = (<span><i>{this.props.dm}</i></span>);

    return (<li className="treeLi" onClick={this.itemClicked}>
            <span className="treeNodeLabel">{this.props.label}</span>{dm}
            {scControl}
        </li>);
  }
}

export default class SampleChanger extends React.Component {
  constructor(props) {
    super(props);

    this.buildTree = this.buildTree.bind(this);
  }

  buildTree(node, root) {
    if (node.children) {
      const childNodes = [];
      for (const c of node.children) {
        childNodes.push(this.buildTree(c));
      }
      return React.createElement(SampleChangerTreeNode,
                                 { label: node.name, selected: node.selected,
                                   root,
                                   dm: node.id,
                                   select: this.props.select,
                                   scan: this.props.scan,
                                   refresh: this.props.refresh },
                                 childNodes);
    }
    return React.createElement(SampleChangerTreeItem,
                               { label: node.name, dm: node.id, load: this.props.load,
                                 unload: this.props.unload });
  }

  render() {
    const nodes = this.buildTree(this.props.contents, true);
    return (<SampleChangerTree title="Sample Changer" state={this.props.state}>
              {nodes}
            </SampleChangerTree>);
  }
}

