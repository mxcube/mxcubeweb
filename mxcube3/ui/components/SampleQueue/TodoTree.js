'use strict';
import React from 'react'
import "bootstrap-webpack"
import Tree from 'react-ui-tree'
import "./app.less"

export default class TodoTree extends React.Component {

  // The render method call from Tree, this checks what node is to be renderd and calls new function
  renderNode(node) {
    switch (node.type) {
      case 'Root':
        return this.renderRoot(node);
      case 'Sample':
        return this.renderSample(node);
      case 'Method':
        return this.renderMethod(node);
      default:
        throw new Error("Type not found, tree"); 
    }
  }

  renderRoot(node){
    return (
        <p className="queue-root">{node.module}</p>
    );

  }

  renderSample(node){

    // This line shouldnt need to be here but it seems that react-ui-tree has some bug
    if(this.props.todoList.indexOf(node.queue_id) > -1){
      return (
        <span className="node node-sample" onClick={() => this.props.select(node.queue_id, node.sample_id)}>
          <input type="checkbox" onChange={() => this.props.toggleCheckBox(node.queue_id)} checked={this.props.checked.indexOf(node.queue_id) !== -1} />
          <span className="node-name">{node.module}</span>
          <i className="fa fa-times" onClick={() => this.props.deleteSample(node.queue_id)}></i>
          <i className="fa fa-sign-in"  onClick={() => this.props.mount(node.queue_id)}></i>
        </span>
        );
    }
  }

  renderMethod(node){
    // This line shouldnt need to be here but it seems that react-ui-tree has some bug
    if(this.props.todoList.indexOf(node.parent_id) > -1 && this.props.queue[node.parent_id].indexOf(node.queue_id) > -1 ){
      return (
        <span className="node node-method" onClick={() => this.props.select(node.queue_id, node.sample_id, node.parent_id, true)}>
        <input type="checkbox" onChange={() => this.props.toggleCheckBox(node.queue_id, node.parent_id)} checked={this.props.checked.indexOf(node.queue_id) !== -1} />
        <span className="node-name">{node.module}</span>
        <i className="fa fa-times" onClick={() => this.props.deleteMethod(node.parent_id, node.queue_id, node.sample_id)}></i>
        { node.module !== "Centring" ? <i className="fa fa-cog" onClick={() => this.props.showForm(node.module.toLowerCase())}></i>: ''}
        </span>
        );
    }
    
  }


  createTree(){
    let todoFiltered = this.props.todoList.filter((queue_id) => {
        let sampleData = this.props.sampleInformation[this.props.lookup[queue_id]];
        return (this.props.searchString === "" || sampleData.id.indexOf(this.props.searchString) > -1 );
    });

    let tree = {
      module: 'ToDo',
      type: "Root",
      children:  todoFiltered.map((queue_id) => {
        let sampleData = this.props.sampleInformation[this.props.lookup[queue_id]];
        return {
          module: 'Vial ' + sampleData.id + " " + sampleData.proteinAcronym,
          queue_id: queue_id,
          sample_id: sampleData.id,
          type: "Sample",
          children : this.props.queue[queue_id].map( (method_id) =>{
            let methodData = sampleData.methods[method_id];
            return {
              module: methodData.name,
              sample_id: sampleData.id,
              queue_id: method_id,
              parent_id: queue_id,
              type: "Method",
              state: methodData.state,
              leaf: true
            };
          }) 

        };
      })
    };
    return tree;
  }


  render() {

    return (
          <Tree
            paddingLeft={20}
            tree={this.createTree()}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode.bind(this)}/>
    );
  }

}