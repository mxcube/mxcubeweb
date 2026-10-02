import { useState } from 'react';
import { Badge, Button } from 'react-bootstrap';

import { mountSample } from '../../actions/sampleChanger';
import { useAppDispatch } from '../../ts-store';
import { getSampleName } from '../../utils';
import CurrentTree from './CurrentTree';
import styles from './Item.module.css';

/**
 * A queued sample and, when expanded, its tasks.
 *
 * @param {Object} props
 * @param {Object} props.sampleData
 * @param {boolean} props.mounted - Is the sample on the goniometer
 */
export default function TodoItem({ sampleData, mounted = false }) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(mounted);

  if (!sampleData) {
    return null;
  }

  const { sampleID, tasks = [] } = sampleData;

  function toggle() {
    setExpanded(!expanded);
  }

  return (
    <div className={styles.nodeSample}>
      <div className={styles.taskHead}>
        <div className={styles.nodeName} style={{ alignItems: 'center' }}>
          <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} me-2`} />
          {mounted ? (
            <span
              role="button"
              tabIndex={0}
              className="me-auto fw-bold"
              aria-expanded={expanded}
              onClick={toggle}
              onKeyDown={(e) => e.key === 'Enter' && toggle()}
            >
              Sample: {getSampleName(sampleData)}
            </span>
          ) : (
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <p className="pt-1 me-auto" onClick={toggle}>
              <b>{`${sampleID} `}</b>
              {`${getSampleName(sampleData)}`}
            </p>
          )}
          {tasks.length > 0 && !expanded && (
            <Badge bg="secondary" className="me-2">
              {tasks.filter((t) => !t.parameters?.groupIndex).length} tasks
            </Badge>
          )}
          {!sampleData.checked && !mounted && (
            <Badge bg="success" className="me-2">
              Done
            </Badge>
          )}
          {mounted ? (
            <Badge bg="primary">Mounted</Badge>
          ) : (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => dispatch(mountSample(sampleData))}
            >
              Mount
            </Button>
          )}
        </div>
      </div>
      {expanded && <CurrentTree currentSample={sampleData} />}
    </div>
  );
}
