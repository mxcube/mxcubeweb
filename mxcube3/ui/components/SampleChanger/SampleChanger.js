import React from 'react';
import { Panel, Button, OverlayTrigger, Tooltip, Glyphicon, ButtonToolbar } from 'react-bootstrap';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import './SampleChanger.css';


export class SampleChangerTree extends React.Component {
    render() {
        return <Panel header={this.props.title} bsStyle="primary">
            {this.props.children}
        </Panel>
    }
}

export class SampleChangerTreeNode extends React.Component {
     getUniqueId() {
         if (SampleChangerTreeNode._uid_count === undefined) {
             SampleChangerTreeNode._uid_count = 0;
         }
         return 'id' + SampleChangerTreeNode._uid_count++;
     }
    
     render() {
         const input_id = this.getUniqueId();
         const scanTooltip = (
             <Tooltip>Scan</Tooltip>
         );
         const selectTooltip = (
             <Tooltip>Select</Tooltip>
         );
         return <li className="treeLi">
             <input type="checkbox" className="treeNode" id={input_id}/>
             <OverlayTrigger placement="top" overlay={selectTooltip}><span><Button className="btn btn-xs btn-link custom-btn-color" bsSize="xsmall"><Glyphicon glyph="record"/></Button></span></OverlayTrigger>
             <label htmlFor={input_id} className="treeNodeLabel">{this.props.label}</label>
             <OverlayTrigger placement="right" overlay={scanTooltip}><Button bsStyle="default" bsSize="xsmall"><Glyphicon glyph="qrcode"/></Button></OverlayTrigger> 
             <ul className="treeUl">
                 {this.props.children}
             </ul>
         </li>
    }
}

export class SampleChangerTreeItem extends React.Component {
    constructor(props) {
        super(props);
        this.itemClicked = this.itemClicked.bind(this);
        this.state = { allow_control: false };
    }
  
    itemClicked() {
        this.setState({allow_control: !this.state.allow_control})
    }
  
    render() {
        const load_tooltip = (<Tooltip>Load this sample</Tooltip>);
        const unload_tooltip = (<Tooltip>Unload sample to this position</Tooltip>);
        let sc_control = "";
        if (this.state.allow_control) {
            sc_control = (<ButtonToolbar>
                <Button bsStyle="primary" bsSize="xsmall">Load sample</Button>
                <Button bsStyle="primary" bsSize="xsmall">Unload here</Button>
            </ButtonToolbar>);
        } 
        return <li className="treeLi" onClick={this.itemClicked}>
            <span className="treeNodeLabel">{this.props.label}</span>
            {sc_control}
        </li>
    }
}

export default class SampleChanger extends React.Component {
    constructor(props) {
        super(props);

        this.buildTree = this.buildTree.bind(this);
    }

    buildTree(node) {
        if (node.children) {
            const childNodes = [];
            for (let c of node.children) {
              childNodes.push(this.buildTree(c))
            }
            return React.createElement(SampleChangerTreeNode, { label: node.name }, childNodes);
        } else {
            return React.createElement(SampleChangerTreeItem, { label: node.name });
        } 
    }       

    render() {
        const nodes = this.buildTree(this.props.contents);
        return (<SampleChangerTree title="Sample Changer">{nodes}</SampleChangerTree>)
    }
}

