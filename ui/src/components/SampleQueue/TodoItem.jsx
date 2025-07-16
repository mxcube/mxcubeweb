import { Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

import { showList } from '../../actions/queueGUI';
import { mountSample } from '../../actions/sampleChanger';
import styles from './Item.module.css';

export default function TodoItem({ sampleData }) {
  const dispatch = useDispatch();

  if (!sampleData) {
    return null;
  }

  function mountAndSwitchTab() {
    dispatch(mountSample(sampleData));
    dispatch(showList('current'));
  }

  const { sampleID, sampleName = '', proteinAcronym = '' } = sampleData;

  return (
    <div className={styles.nodeSample}>
      <div className={styles.taskHead}>
        <div className={styles.nodeName}>
          <p className="pt-1 me-auto">
            <b>{`${sampleID} `}</b>
            {`${proteinAcronym} ${sampleName}`}
          </p>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={mountAndSwitchTab}
          >
            Mount
          </Button>
        </div>
      </div>
    </div>
  );
}
