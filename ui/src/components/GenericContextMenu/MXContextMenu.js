import React from 'react';
import { Dropdown } from 'react-bootstrap';

import './MXContextMenu.css'

export default class MXContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.showContextMenu = this.showContextMenu.bind(this)
    this.hideContextMenu = this.hideContextMenu.bind(this)
  }

  componentDidMount() {
    this.showContextMenu(this.props.x, this.props.y)
  }

  componentWillUnmount() {
    this.hideContextMenu()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.show) {
      this.showContextMenu(nextProps.x, nextProps.y);
    } else {
      this.hideContextMenu();
    }
  }

  showContextMenu(x, y) {
    const contextMenu = document.querySelector('#generic-contextMenu');
    if (contextMenu) {
      contextMenu.style.top = `${y - 70}px`;
      contextMenu.style.left = `${x -10}px`;
      contextMenu.style.display = 'block';
      contextMenu.style.transform =  "rotateY(0deg) rotateX(0deg)";
    }
  }


  hideContextMenu() {
    const ctxMenu = document.querySelector('#generic-contextMenu');
    if (ctxMenu) {
      ctxMenu.style.display = 'none';
    }
  }

  render() {
    return (
      <Dropdown.Menu className="generic-context-menu" show={this.props.show} id="generic-contextMenu" role="menu">
       {this.props.children}
      </Dropdown.Menu>
    );
  }
}
