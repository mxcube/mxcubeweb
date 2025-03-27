import React, { useState } from 'react';
import { Card, Dropdown, Form, Button, DropdownButton } from 'react-bootstrap';

import { Menu, Item, Separator, contextMenu } from 'react-contexify';

import styles from './equipment.module.css';

function getUniqueId() {
  if (renderSampleChangerTreeNode._uid_count === undefined) {
    renderSampleChangerTreeNode._uid_count = 0;
  }
  return `SCTreeNodeID${renderSampleChangerTreeNode._uid_count++}`;
}

function treeNodeCbxClick(e) {
  const treeNodeIcon = document.querySelector(`#${e.target.id}icon`);
  if (treeNodeIcon) {
    if (e.target.checked) {
      treeNodeIcon.className = 'fa fa-minus';
    } else {
      treeNodeIcon.className = 'fa fa-plus';
    }
  }
}

function showContextMenu(event, id) {
  contextMenu.show({
    id,
    event,
  });
}

function renderSampleChangerTreeNode(props) {
  function selectClicked() {
    props.select(props.label);
  }

  function scanClicked() {
    props.scan(props.label);
  }

  const inputId = getUniqueId();

  return (
    <div key={props.label}>
      <li className={styles.treeLi}>
        <input
          type="checkbox"
          className={styles.treeNode}
          id={inputId}
          onClick={treeNodeCbxClick}
        />
        <Form.Label
          onContextMenu={(e) => showContextMenu(e, `${props.label}`)}
          htmlFor={inputId}
          className={styles.treeNodeLabel}
        >
          <i id={`${inputId}icon`} className="fa fa-plus" />
          &nbsp;
          {props.label}
        </Form.Label>
        <ul className={styles.treeUl}>{props.children}</ul>
      </li>

      <Menu id={`${props.label}`}>
        <li role="heading" aria-level="2" className="dropdown-header">
          <b>Container {props.label}</b>
        </li>
        <Separator />
        <Item onClick={scanClicked}>Scan</Item>
        <Item onClick={selectClicked}>Move to this container</Item>
      </Menu>
    </div>
  );
}

function SampleChangerTreeItem(props) {
  const [dropdownIsOpen, setDropdownIsOpen] = useState(false);

  function handleMountClick() {
    toggleDropdown();
    props.load({
      sampleID: props.label,
      location: props.label,
    });
  }

  function handleUnmountClick() {
    toggleDropdown();
    props.unload(props.label);
  }

  function toggleDropdown() {
    setDropdownIsOpen(!dropdownIsOpen);
  }

  const ls =
    props.status === 'Loaded' ? { display: 'inline' } : { display: 'none' };

  return (
    <div>
      <li className={styles.treeLi}>
        <div className={styles.sampleLabel}>
          <DropdownButton
            style={{ fontStyle: 'italic', padding: '0.2em 0.2em' }}
            title={`${props.label} ${props.dm}`}
            variant="link"
            onToggle={toggleDropdown}
            open={dropdownIsOpen}
          >
            <Dropdown.Header aria-level="2" className="dropdown-header">
              <b>Position : {props.label}</b>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleMountClick}>Mount</Dropdown.Item>
            {props.loadedSample === props.label && (
              <Dropdown.Item onClick={handleUnmountClick}>
                Umount this position
              </Dropdown.Item>
            )}
          </DropdownButton>
          <span style={ls}>
            &nbsp;
            <i className="fas fa-arrow-left" /> <b>(Mounted)</b>
          </span>
        </div>
      </li>
    </div>
  );
}

export default function SampleChanger(props) {
  function scan() {
    props.scan('');
  }

  function unload() {
    props.unload('');
  }

  function abort() {
    props.abort();
  }
  function handleRefresh() {
    props.refresh();
  }

  function renderTree(node, root) {
    if (node.children) {
      const childNodes = [];
      for (const c of node.children) {
        childNodes.push(renderTree(c));
      }
      const treeNodeProps = {
        label: node.name,
        selected: node.selected,
        root,
        dm: node.id,
        select: props.select,
        status: node.status,
        scan: props.scan,
        refresh: props.refresh,
        key: node.name,
        children: childNodes,
      };
      return renderSampleChangerTreeNode(treeNodeProps);
    }

    return (
      <SampleChangerTreeItem
        label={node.name}
        dm={node.id}
        load={props.load}
        status={node.status}
        unload={props.unload}
        key={node.name}
        loadedSample={props.loadedSample?.address}
      />
    );
  }

  // display some buttons depending on available features
  const nodes = renderTree(props.contents, true);
  let current = '';
  let abortButton = '';

  if (props.loadedSample.address) {
    current = (
      <div style={{ marginTop: '1em' }}>
        Currently loaded: {props.loadedSample.address}
        <span style={{ marginRight: '1em' }} />( {props.loadedSample.barcode} )
        <span style={{ marginRight: '1em' }} />
        <Button variant="outline-secondary" onClick={unload}>
          <i className="fas fa-download" /> Unload
        </Button>
      </div>
    );
  } else {
    current = <div style={{ marginTop: '1em', marginBottom: '1em' }} />;
  }

  if (props.state === 'MOVING') {
    abortButton = (
      <Button variant="danger" className={styles.abortButton} onClick={abort}>
        <i className="fas fa-stop" /> Abort
      </Button>
    );
  } else {
    abortButton = '';
  }

  return (
    <Card className="mb-3">
      <Card.Header>Content</Card.Header>
      <Card.Body>
        <Button variant="outline-secondary" onClick={() => handleRefresh()}>
          <i className="fas fa-sync" /> Refresh
        </Button>
        <Button
          style={{ marginLeft: '1em' }}
          variant="outline-secondary"
          onClick={scan}
        >
          <i className="fas fa-qrcode" /> Scan all containers
        </Button>
        <span style={{ marginLeft: '1em' }}>{abortButton}</span>
        {current}
        <div style={{ marginBottom: '1em' }} />
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>{nodes}</div>
      </Card.Body>
    </Card>
  );
}
