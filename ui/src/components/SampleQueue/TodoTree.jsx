import './app.css';

import { useState } from 'react';
import { Button, Form, ListGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { prepareBeamlineForNewSample } from '../../actions/beamline';
import { showTaskForm } from '../../actions/taskForm';
import { QUEUE_RUNNING } from '../../constants';
import TodoItem from './TodoItem';

export default function TodoTree(props) {
  const { list } = props;

  const dispatch = useDispatch();

  const queueStatus = useSelector((state) => state.queue.queueStatus);
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);

  const [searchWord, setSearchWord] = useState('');

  function showAddSampleForm() {
    dispatch(prepareBeamlineForNewSample());
    dispatch(showTaskForm('AddSample'));
  }

  const current_list = list.filter((sampleID) =>
    String(sampleID).includes(searchWord),
  );

  return (
    <ListGroup variant="flush">
      <ListGroup.Item
        className="d-flex list-head"
        style={{ borderBottom: 'none' }}
      >
        <Form className="me-auto">
          <Form.Control
            type="search"
            size="sm"
            placeholder="Search Upcoming"
            onChange={(e) => setSearchWord(e.target.value)}
            style={{ width: '90%' }}
          />
        </Form>
        <div>
          <Button
            disabled={queueStatus === QUEUE_RUNNING}
            className="btn-primary"
            size="sm"
            onClick={showAddSampleForm}
          >
            Create new sample
          </Button>
        </div>
      </ListGroup.Item>
      <ListGroup.Item className="d-flex list-body">
        {current_list.map((key) => {
          const sampleData = sampleList[key];
          return <TodoItem sampleData={sampleData} key={`Sample ${key}`} />;
        })}
      </ListGroup.Item>
    </ListGroup>
  );
}
