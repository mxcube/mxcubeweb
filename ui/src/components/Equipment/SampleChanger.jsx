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
  if (SampleChangerTreeNode._uid_count === undefined) {
    SampleChangerTreeNode._uid_count = 0;
  }
  return `SCTreeNodeID${SampleChangerTreeNode._uid_count++}`;
}

function treeNodeCbxClick(evt) {
  const treeNodeIcon = document.querySelector(`#${evt.target.id}icon`);
  if (treeNodeIcon) {
    treeNodeIcon.className = `fa fa-${evt.target.checked ? 'minus' : 'plus'}`;
  }
}

function SampleChangerTreeNode(props) {
  const { label, children } = props;

  const dispatch = useDispatch();
  const inputId = getUniqueId();

  return (
    <div key={label}>
      <li className={styles.treeLi}>
        <input
          type="checkbox"
          className={styles.treeNode}
          id={inputId}
          onClick={treeNodeCbxClick}
        />
        <Form.Label
          className={styles.treeNodeLabel}
          htmlFor={inputId}
          onContextMenu={(event) => {
            contextMenu.show({ id: `${label}`, event });
          }}
        >
          <i id={`${inputId}icon`} className="fa fa-plus" />
          &nbsp;
          {label}
        </Form.Label>
        <ul className={styles.treeUl}>{children}</ul>
      </li>

      <Menu id={`${label}`}>
        <li role="heading" aria-level="2" className="dropdown-header">
          <b>Container {label}</b>
        </li>
        <Separator />
        <Item onClick={() => dispatch(scan(label))}>Scan</Item>
        <Item onClick={() => dispatch(select(label))}>
          Move to this container
        </Item>
      </Menu>
    </div>
  );
}

// eslint-disable-next-line react/no-multi-comp
function SampleChangerTreeItem(props) {
  const { label, status, dm } = props;
  const dispatch = useDispatch();

  const [dropdownIsOpen, setDropdownIsOpen] = useState(false);

  const loadedSampleAddress = useSelector(
    (state) => state.sampleChanger.loadedSample?.address,
  );

  function handleMountClick() {
    toggleDropdown();
    dispatch(mountSample({ sampleID: label, location: label }));
  }

  function handleUnmountClick() {
    toggleDropdown();
    dispatch(unmountSample());
  }

  function toggleDropdown() {
    setDropdownIsOpen(!dropdownIsOpen);
  }

  const ls = status === 'Loaded' ? { display: 'inline' } : { display: 'none' };

  return (
    <div>
      <li className={styles.treeLi}>
        <div className={styles.sampleLabel}>
          <DropdownButton
            style={{ fontStyle: 'italic', padding: '0.2em 0.2em' }}
            title={`${label} ${dm}`}
            variant="link"
            onToggle={toggleDropdown}
            open={dropdownIsOpen}
          >
            <Dropdown.Header aria-level="2" className="dropdown-header">
              <b>Position : {label}</b>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleMountClick}>Mount</Dropdown.Item>
            {loadedSampleAddress === label && (
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
function SampleChanger() {
  const dispatch = useDispatch();

  const scState = useSelector((state) => state.sampleChanger.state);
  const loadedSample = useSelector((state) => state.sampleChanger.loadedSample);
  const contents = useSelector((state) => state.sampleChanger.contents);

  function renderTree(node, root = false) {
    if (node.children) {
      return (
        <SampleChangerTreeNode
          key={node.name}
          label={node.name}
          selected={node.selected}
          root={root}
          dm={node.id}
          status={node.status}
        >
          {node.children.map(renderTree)}
        </SampleChangerTreeNode>
      );
    }

    return (
      <SampleChangerTreeItem
        label={node.name}
        dm={node.id}
        status={node.status}
        key={node.name}
      />
    );
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

        {loadedSample.address ? (
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
        ) : (
          <div style={{ marginTop: '1em', marginBottom: '1em' }} />
        )}

        <div style={{ marginBottom: '1em' }} />
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {renderTree(contents, true)}
        </div>
      </Card.Body>
    </Card>
  );
}

export default SampleChanger;
