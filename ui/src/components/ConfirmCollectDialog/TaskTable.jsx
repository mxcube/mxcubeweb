import { useState } from 'react';
import { OverlayTrigger, Popover, Table } from 'react-bootstrap';
import { useSelector } from 'react-redux';

import { getSampleName } from '../../utils';
import TaskOverlayTable from './TaskOverlayTable';
import styles from './TaskTable.module.css';

export default function TaskTable(props) {
  const { tasks } = props;
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const rootPath = useSelector((state) => state.login.rootPath);
  // We handle the show state of each Overlay internally to hide them when scrolling
  const [popoverShown, setPopoverShown] = useState({});

  function handleScroll() {
    setPopoverShown({});
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.emptyTable}>
        No tasks added to any of the samples, you have the possibility to add
        tasks while the queue is running. <br />
        The queue is executed sample by sample and will wait until
        <b> Mount Next Sample </b> is pressed before mounting the next sample{' '}
        <br />
      </div>
    );
  }

  return (
    <div className={styles.scroll} onScroll={handleScroll}>
      <Table responsive bordered hover className={styles.tableStriped}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Sample</th>
            <th>Path</th>
            <th># Images</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const parameters =
              task.type === 'Interleaved'
                ? task.parameters.wedges[0].parameters
                : task.parameters;

            const sample = sampleList[task.sampleID];
            const relativePath = parameters.fullPath.split(rootPath).pop();

            return (
              <OverlayTrigger
                key={task.queueID}
                placement="bottom"
                show={!!popoverShown[task.queueID]}
                onToggle={(show) =>
                  setPopoverShown((prev) => ({
                    ...prev,
                    [task.queueID]: show,
                  }))
                }
                overlay={
                  <Popover className={styles.taskPopover}>
                    <TaskOverlayTable task={task} />
                  </Popover>
                }
              >
                <tr id={task.queueID}>
                  <td>{task.label}</td>
                  <td>
                    {getSampleName(sample)} ({sample.location})
                  </td>
                  <td>
                    <b style={{ color: '#337ab7' }}>...{relativePath}</b>
                  </td>
                  <td>{parameters.num_images || '-'}</td>
                </tr>
              </OverlayTrigger>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
