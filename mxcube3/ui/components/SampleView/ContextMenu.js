'use strict';
import React from 'react'


export default class ContextMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {options: {
      SAVED : [
        {text: "Add Characterisation", action: () => this.showModal("characterisation")},
        {text: "Add Datacollection", action: () => this.showModal("characterisation")},
        {text: "Delete Point", action: () => this.props.deleteShape()}
      ],
      TMP : [
        {text: "Save Point", action: () => this.props.saveShape()},
        {text: "Delete Point", action: () => this.props.deleteShape()}
      ],
      GROUP : [
        {text: "Draw Line", action: () => console.log("Draw Line")},
        {text: "Delete Selected (NA)", action: () => console.log("Delete All")}
      ],
      LINE : [
        {text: "Add Helical Scan (NA)", action: () => console.log("Add Helical Scan (NA)")},
        {text: "Delete Line", action: () => this.props.deleteShape()}
      ],
      NONE : []
    }
  };
  }

  componentWillReceiveProps(nextProps) {
    (nextProps.show ? this.showContextMenu(nextProps.x, nextProps.y) : this.hideContextMenu() );
  }

  showModal(modalName){
    this.props.showForm(modalName, true);
    this.hideContextMenu();
  }

  showContextMenu(x,y){
    document.getElementById("contextMenu").style.top = y + "px";
    document.getElementById("contextMenu").style.left = x + "px";
    document.getElementById("contextMenu").style.display = "block";
  }

  hideContextMenu(){
    document.getElementById("contextMenu").style.display = "none";
  }

  listOptions(type){
    return ( 
        <li><a onClick={type.action}>{type.text}</a></li>
        );
}

  render() {

    return (
            <ul id="contextMenu" className="dropdown-menu" role="menu">
            {this.state.options[this.props.type].map(this.listOptions)}
            </ul>
            );        
  }
}



