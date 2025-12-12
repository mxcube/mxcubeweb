/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { OverlayTrigger, Popover } from 'react-bootstrap';

import styles from './Item.module.css';
import TaskItemContainer from './TaskItemContainer';

function XRFTaskItem(props) {
  function showForm() {
    const { data, sampleId } = props;
    const { type, parameters } = data;
    props.showForm(type, sampleId, data, parameters.shape);
  }

  function pointIDString(parameters) {
    let res = '';

    if (parameters.shape !== -1) {
      try {
        res = `${props.shapes.shapes[parameters.shape].name}: `;
      } catch {
        res = '';
      }
    }

    return `${res}`;
  }

  function renderPath(parameters) {
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

  const { data } = props;
  const { parameters } = data;

  return (
    <TaskItemContainer
      index={props.index}
      data={data}
      pointIDString={pointIDString(parameters)}
    >
      <div className={styles.taskBody}>
        <div>
          <div style={{ border: '1px solid #DDD' }}>
            <div style={{ padding: '0.5em' }} onClick={showForm}>
              <b>Path:</b> {renderPath(parameters)}
              <br />
              <b>Count time:</b> {parameters.countTime}
            </div>
          </div>
        </div>
      </div>
    </TaskItemContainer>
  );
}

export default XRFTaskItem;
