import React from 'react';
import {
  Card, Dropdown, Form, Button, DropdownButton,
} from 'react-bootstrap';

import { Menu, Item, Separator, contextMenu } from 'react-contexify';

import './SampleChanger.css';
 

export class SampleChangerTree extends React.Component {
  render() {
    let titleBackground;

    switch (this.props.state) {
    case 'READY': {
      titleBackground = 'success';
    
    break;
    }
    case 'MOVING': {
      titleBackground = 'warning';
    
    break;
    }
    case 'DISABLED': {
      titleBackground = 'default';
    
    break;
    }
    default: {
      titleBackground = 'danger';
    }
    }

    return (
      <Card className='mb-3' style={{ marginTop: '0.5em' }} bg={titleBackground}>
        <Card.Header>
          {this.props.title}
        </Card.Header>
        {this.props.children}
      </Card>
    );
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

  treeNodeCbxClick(e) {
    const treeNodeIcon = document.getElementById(`${e.target.id}icon`);
    if (treeNodeIcon) {
      if (e.target.checked) {
        treeNodeIcon.className = 'fa fa-minus';
      } else {
        treeNodeIcon.className = 'fa fa-plus';
      }
    }
  }

  showContextMenu(event, id) {
    contextMenu.show({
      id,
      event: event,
    });
  }

  render() {
    const inputId = this.getUniqueId();

    return (
      <div>
        <li className="treeLi">
          <input
            type="checkbox"
            className="treeNode"
            id={inputId}
            onClick={this.treeNodeCbxClick}
          />
            <Form.Label onContextMenu={(e) => this.showContextMenu(e, `${this.props.label}`)} htmlFor={inputId} className="treeNodeLabel">
              <i id={`${inputId}icon`} className="fa fa-plus" />
                &nbsp;
              {this.props.label}
            </Form.Label>
          <ul className="treeUl">
            {this.props.children}
          </ul>
        </li>

        <Menu id={`${this.props.label}`}>
          <li role="heading" aria-level="2" className="dropdown-header">
            <b>
              Container
              {' '}
              {this.props.label}
            </b>
          </li>
          <Separator />
          <Item onClick={this.scanClicked}>
            Scan
          </Item>
          <Item onClick={this.selectClicked}>
            Move to this container
          </Item>
        </Menu>
      </div>
    );
  }
}

export class SampleChangerTreeItem extends React.Component {
  constructor(props) {
    super(props);
    this.itemClicked = this.itemClicked.bind(this);
    this.state = { allow_control: false, dropdownIsOpen: false };
    this.loadSample = this.loadSample.bind(this);
    this.unloadSample = this.unloadSample.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
  }

  itemClicked() {
     
    this.setState({ allow_control: !this.state.allow_control });
    /* eslint-enable react/no-set-state */
  }

  loadSample() {
    this.toggleDropdown();
    this.props.load({
      sampleID: this.props.label,
      location: this.props.label
    });
  }

  unloadSample() {
    this.toggleDropdown();
    this.props.unload(this.props.label);
  }

  toggleDropdown() {
    this.setState({ dropdownIsOpen: !this.state.dropdownIsOpen });
  }


  render() {
    const ls = this.props.status === 'Loaded' ? { display: 'inline' } : { display: 'none' };

    return (
      <div>
        <li className="treeLi">
          <div className="sampleLabel">
            <DropdownButton
              style={{ fontStyle: 'italic', padding: '0.2em 0.2em' }}
              title={`${this.props.label} ${this.props.dm}`}
              variant="link"
              onToggle={this.toggleDropdown}
              open={this.state.dropdownIsOpen}
            >
              <Dropdown.Header aria-level="2" className="dropdown-header">
                <b>
                  Position :
                  {' '}
                  {this.props.label}
                </b>
              </Dropdown.Header>
              <Dropdown.Divider/>
              <Dropdown.Item onClick={this.loadSample}>
                Mount
              </Dropdown.Item>
              <Dropdown.Item onClick={this.unloadSample}>
                Umount to this position
              </Dropdown.Item>
            </DropdownButton>
            <span style={ls}>
              &nbsp;
              <i className="fas fa-arrow-left" />
              {' '}
              <b>(Mounted)</b>
            </span>
          </div>
        </li>
      </div>
    );
  }
}

export default class SampleChanger extends React.Component {
  constructor(props) {
    super(props);
    this.buildTree = this.buildTree.bind(this);
    this.scan = this.scan.bind(this);
    this.unload = this.unload.bind(this);
    this.abort = this.abort.bind(this);
  }


  scan() {
    this.props.scan('');
  }

  unload() {
    this.props.unload('');
  }

  abort() {
    this.props.abort();
  }

  buildTree(node, root) {
    if (node.children) {
      const childNodes = [];
      for (const c of node.children) {
        childNodes.push(this.buildTree(c));
      }

      return React.createElement(SampleChangerTreeNode,
        {
          label: node.name,
          selected: node.selected,
          root,
          dm: node.id,
          select: this.props.select,
          status: node.status,
          scan: this.props.scan,
          refresh: this.props.refresh,
          key: node.name
        },
        childNodes);
    }

    return React.createElement(SampleChangerTreeItem,
      {
        label: node.name,
        dm: node.id,
        load: this.props.load,
        status: node.status,
        unload: this.props.unload,
        key: node.name
      });
  }

  // display some buttons depending on available features
  render() {
    const nodes = this.buildTree(this.props.contents, true);
    let current = '';
    let abortButton = '';

    if (this.props.loadedSample.address) {
      current = (
        <div style={{ marginTop: '1em' }}>
                        Currently loaded:
          {' '}
          {this.props.loadedSample.address}
          <span style={{ marginRight: '1em' }} />
                         (
          {' '}
          {this.props.loadedSample.barcode}
          {' '}
)
          <span style={{ marginRight: '1em' }} />
          <Button variant="outline-secondary" onClick={this.unload}>
            <i className="fas fa-download" />
            {' '}
            Unload
          </Button>
        </div>
      );
    } else {
      current = (<div style={{ marginTop: '1em', marginBottom: '1em' }} />);
    }

    if (this.props.state === 'MOVING') {
      abortButton = (
        <Button variant="danger" className="abortButton" onClick={this.abort}>
          <i className="fas fa-stop" />
          {' '}
        Abort
        </Button>
      );
    } else {
      abortButton = '';
    }

    return (
      <Card className='mb-3'>
        <Card.Header>
          Content
        </Card.Header>
        <Card.Body>
            <Button  variant="outline-secondary" onClick={this.props.refresh}>
              <i className="fas fa-sync" /> 
              {' '}
              Refresh
            </Button>
            <Button style={{ marginLeft: '1em' }} variant="outline-secondary" onClick={this.scan}>
              <i className="fas fa-qrcode" />
              {' '}
              Scan all containers
            </Button>
            <span style={{ marginLeft: '1em' }}>{abortButton}</span>
            {current}
            <div style={{ marginBottom: '1em' }} />
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {nodes}
            </div>
        </Card.Body>
      </Card>
    );
  }
}
