/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/control-has-associated-label */
import { useState } from 'react';
import { Button, Card, Dropdown, DropdownButton, Form } from 'react-bootstrap';
import { contextMenu, Item, Menu, Separator } from 'react-contexify';
import { useDispatch, useSelector } from 'react-redux';

import {
  abort,
  mountSample,
  refresh,
  scan,
  select,
  unmountSample,
} from '../../actions/sampleChanger';
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
  const dispatch = useDispatch();
  const [dropdownIsOpen, setDropdownIsOpen] = useState(false);

  function handleMountClick() {
    toggleDropdown();
    dispatch(
      mountSample({
        sampleID: props.label,
        location: props.label,
      }),
    );
  }

  function handleUnmountClick() {
    toggleDropdown();
    dispatch(unmountSample());
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

// eslint-disable-next-line react/no-multi-comp
export default function SampleChanger() {
  const dispatch = useDispatch();

  const scState = useSelector((state) => state.sampleChanger.state);
  const loadedSample = useSelector((state) => state.sampleChanger.loadedSample);
  const contents = useSelector((state) => state.sampleChanger.contents);

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
        select: (address) => dispatch(select(address)),
        status: node.status,
        scan: (container) => dispatch(scan(container)),
        refresh: () => dispatch(refresh()),
        key: node.name,
        children: childNodes,
      };
      return renderSampleChangerTreeNode(treeNodeProps);
    }

    return (
      <SampleChangerTreeItem
        label={node.name}
        dm={node.id}
        status={node.status}
        key={node.name}
        loadedSample={loadedSample?.address}
      />
    );
  }

  // display some buttons depending on available features
  const nodes = renderTree(contents, true);
  let current = '';

  if (loadedSample.address) {
    current = (
      <div style={{ marginTop: '1em' }}>
        Currently loaded: {loadedSample.address}
        <span style={{ marginRight: '1em' }} />( {loadedSample.barcode} )
        <span style={{ marginRight: '1em' }} />
        <Button
          variant="outline-secondary"
          onClick={() => {
            dispatch(unmountSample());
          }}
        >
          <i className="fas fa-download" /> Unload
        </Button>
      </div>
    );
  } else {
    current = <div style={{ marginTop: '1em', marginBottom: '1em' }} />;
  }

  return (
    <Card className="mb-3">
      <Card.Header>Content</Card.Header>
      <Card.Body>
        <Button
          variant="outline-secondary"
          onClick={() => {
            dispatch(refresh());
          }}
        >
          <i className="fas fa-sync" /> Refresh
        </Button>
        <Button
          style={{ marginLeft: '1em' }}
          variant="outline-secondary"
          onClick={() => {
            dispatch(scan(''));
          }}
        >
          <i className="fas fa-qrcode" /> Scan all containers
        </Button>
        <span style={{ marginLeft: '1em' }}>
          {scState === 'MOVING' && (
            <Button
              variant="danger"
              className={styles.abortButton}
              onClick={() => {
                dispatch(abort());
              }}
            >
              <i className="fas fa-stop" /> Abort
            </Button>
          )}
        </span>
        {current}
        <div style={{ marginBottom: '1em' }} />
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>{nodes}</div>
      </Card.Body>
    </Card>
  );
}
