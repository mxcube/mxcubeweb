import { useState } from 'react';
import { Alert, Button, ButtonGroup, Card, Dropdown } from 'react-bootstrap';
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

function SampleChangerTreeNode(props) {
  const { label, disabled, children } = props;

  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);

  return (
    <li className={styles.treeItem}>
      <Dropdown as={ButtonGroup}>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => setExpanded(!expanded)}
        >
          <i className={`fa fa-${expanded ? 'minus' : 'plus'} me-2`} />
          {label}
        </Button>

        <Dropdown.Toggle
          id={`sample_changer_tree_node_${label}`}
          split
          variant="secondary"
          disabled={disabled}
        />
        <Dropdown.Menu>
          <Dropdown.Header className="fw-bold">
            Container {label}
          </Dropdown.Header>

          <Dropdown.Divider />
          <Dropdown.Item onClick={() => dispatch(scan(label))}>
            Scan
          </Dropdown.Item>
          <Dropdown.Item onClick={() => dispatch(select(label))}>
            Move to this container
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <ul hidden={!expanded}>{children}</ul>
    </li>
  );
}

// eslint-disable-next-line react/no-multi-comp
function SampleChangerTreeItem(props) {
  const { label, dm, disabled } = props;
  const dispatch = useDispatch();

  const isMounted = useSelector(
    (state) => state.sampleChanger.loadedSample?.address === label,
  );

  return (
    <li className={styles.treeItem}>
      <Dropdown className="d-inline-flex align-items-center mt-1">
        <Dropdown.Toggle size="sm" variant="light" disabled={disabled}>
          <span className="me-1">
            {label} {dm}
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Header className="fw-bold">
            Position: {label}
          </Dropdown.Header>

          <Dropdown.Divider />
          {isMounted ? (
            <Dropdown.Item onClick={() => dispatch(unmountSample())}>
              Umount this position
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              onClick={() => {
                dispatch(mountSample({ sampleID: label, location: label }));
              }}
            >
              Mount
            </Dropdown.Item>
          )}
        </Dropdown.Menu>

        {isMounted && (
          <>
            <i className="fas fa-arrow-left mx-2" /> <b>Mounted</b>
          </>
        )}
      </Dropdown>
    </li>
  );
}

// eslint-disable-next-line react/no-multi-comp
function SampleChanger() {
  const dispatch = useDispatch();

  const isLoading = useSelector(
    (state) => state.sampleChanger.state === 'LOADING',
  );
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
          disabled={isLoading}
        >
          {node.children.map(renderTree)}
        </SampleChangerTreeNode>
      );
    }

    return (
      <SampleChangerTreeItem
        key={node.name}
        label={node.name}
        dm={node.id}
        disabled={isLoading}
      />
    );
  }

  return (
    <Card className="mb-3">
      <Card.Header>Content</Card.Header>
      <Card.Body>
        <Button
          className="me-2"
          size="sm"
          variant="outline-secondary"
          onClick={() => dispatch(refresh())}
        >
          <i className="fas fa-sync" /> Refresh
        </Button>

        <Button
          className="me-2"
          size="sm"
          variant="outline-secondary"
          onClick={() => dispatch(scan(''))}
        >
          <i className="fas fa-qrcode" /> Scan all containers
        </Button>

        {isLoading && (
          <Button size="sm" variant="danger" onClick={() => dispatch(abort())}>
            <i className="fas fa-stop" /> Abort
          </Button>
        )}

        {loadedSample.address && (
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => dispatch(unmountSample())}
          >
            <i className="fas fa-download" /> Unmount
          </Button>
        )}

        <Alert className="mt-3">
          {loadedSample.address ? (
            <>
              Currently mounted:{' '}
              <strong className="me-2 text-nowrap">
                {loadedSample.address} ({loadedSample.barcode})
              </strong>
            </>
          ) : (
            'No sample loaded'
          )}
        </Alert>

        <div className={styles.treeWrapper}>{renderTree(contents, true)}</div>
      </Card.Body>
    </Card>
  );
}

export default SampleChanger;
