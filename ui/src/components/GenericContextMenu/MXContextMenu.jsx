import './MXContextMenu.css';

import React from 'react';
import { Dropdown } from 'react-bootstrap';

export default class MXContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.showContextMenu = this.showContextMenu.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
  }

  componentDidMount() {
    this.showContextMenu(this.props.x, this.props.y);
    document.addEventListener('click', this.hideContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.hideContextMenu);
  }

  showContextMenu(x, y) {
    const contextMenu = document.querySelector('#generic-contextMenu');
    if (contextMenu) {
      const windowWidth = document.body.offsetWidth;
      const menuEndPos = x + contextMenu.offsetWidth;

      let posxoffset = 10;
      if (menuEndPos > windowWidth) {
        posxoffset = contextMenu.offsetWidth;
      }
      contextMenu.style.top = `${y - 70}px`;
      contextMenu.style.left = `${x - posxoffset}px`;
      contextMenu.style.display = 'block';
      contextMenu.style.transform = 'rotateY(0deg) rotateX(0deg)';
    }
  }

  hideContextMenu() {
    const ctxMenu = document.querySelector('#generic-contextMenu');
    if (ctxMenu) {
      ctxMenu.classList.add('generic-context-menu-close');
    }
    this.props.showGenericContextMenu(false, null, 0, 0);
  }

  render() {
    return (
      <Dropdown.Menu
        className="generic-context-menu"
        show={this.props.show}
        id="generic-contextMenu"
        role="menu"
      >
        {this.props.children}
      </Dropdown.Menu>
    );
  }
}
