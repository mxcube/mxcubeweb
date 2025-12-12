/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button } from 'react-bootstrap';

import TooltipTrigger from '../TooltipTrigger';
import styles from './Item.module.css';
import TaskItemContainer from './TaskItemContainer';

function WorkflowTaskItem(props) {
  function pointIDString(parameters) {
    let res = '';

    if (parameters.shape !== -1) {
      try {
        res = `${props.shapes.shapes[parameters.shape].name}: `;
      } catch {
        res = '';
      }
    }

    return res;
  }

  function renderPath(parameters) {
    const path = parameters.path || '';
    const pathEndPart = path.slice(-40);

    return (
      <TooltipTrigger id="wedge-path-tooltip" tooltipContent={path}>
        <a style={{ flexGrow: 1 }}>
          .../{pathEndPart.slice(pathEndPart.indexOf('/') + 1)}
        </a>
      </TooltipTrigger>
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
          <div className={styles.dataPath}>
            <b>Path:</b>
            {renderPath(parameters)}
            <Button
              variant="outline-secondary"
              style={{ width: '3em' }}
              title="Copy path"
              onClick={() => {
                navigator.clipboard.writeText(`${parameters.path}`);
              }}
            >
              <i className="fa fa-copy" aria-hidden="true" />
            </Button>
            <Button
              variant="outline-secondary"
              style={{ width: '3em' }}
              title="Open parameters dialog"
              onClick={() => props.showWorkflowParametersDialog(null, true)}
            >
              <i aria-hidden="true" className="fa fa-sliders-h" />
            </Button>
          </div>
        </div>
      </div>
    </TaskItemContainer>
  );
}

export default WorkflowTaskItem;
