/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { OverlayTrigger, Popover } from 'react-bootstrap';

import styles from './Item.module.css';
import TaskItemContainer from './TaskItemContainer';

function EnergyScanTaskItem(props) {
  const { index, data, sampleId, shapes, showForm } = props;
  const { type, parameters } = data;

  function handleParamsTableClick() {
    showForm(type, sampleId, data, parameters.shape);
  }

  function pointIDString() {
    let res = '';

    if (parameters.shape !== -1) {
      try {
        res = `${shapes.shapes[parameters.shape].name}: `;
      } catch {
        res = '';
      }
    }

    return res;
  }

  function renderPath() {
    const value = parameters.fileName;
    const path = parameters.path || '';

    return (
      <OverlayTrigger
        trigger="click"
        placement="top"
        rootClose
        overlay={
          <Popover
            id="wedge-popover"
            style={{ maxWidth: '2000px', width: 'auto' }}
          >
            <input
              type="text"
              onFocus={(e) => {
                e.target.select();
              }}
              value={path}
              size={path.length + 10}
            />
          </Popover>
        }
      >
        <a onClick={(e) => e.stopPropagation()}>{value}</a>
      </OverlayTrigger>
    );
  }

  return (
    <TaskItemContainer
      index={index}
      data={data}
      pointIDString={pointIDString()}
    >
      <div className={styles.taskBody}>
        <div>
          <div style={{ border: '1px solid #DDD' }}>
            <div style={{ padding: '0.5em' }} onClick={handleParamsTableClick}>
              <b>Path:</b> {renderPath()}
              <br />
              <b>Element:</b> {parameters.element}
              <br />
              <b>Edge:</b> {parameters.edge}
            </div>
          </div>
        </div>
      </div>
    </TaskItemContainer>
  );
}

export default EnergyScanTaskItem;
