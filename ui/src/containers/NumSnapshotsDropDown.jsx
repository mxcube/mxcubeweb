import { Dropdown, DropdownButton } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setNumSnapshots } from '../actions/queue';

function NumSnapshotsDropDown(props) {
  const dispatch = useDispatch();
  const numSnapshots = useSelector((state) => state.queue.numSnapshots);

  return (
    <DropdownButton
      id="numSnapshotsDropDown"
      variant="outline-secondary"
      align={{ sm: props.align }}
      title={
        <span>
          <i className="fas fa-1x fa-camera" /> &nbsp; Crystal snapshots (
          {numSnapshots})
        </span>
      }
    >
      <Dropdown.Item key="0" onClick={() => dispatch(setNumSnapshots(0))}>
        0
      </Dropdown.Item>
      <Dropdown.Item key="1" onClick={() => dispatch(setNumSnapshots(1))}>
        1
      </Dropdown.Item>
      <Dropdown.Item key="2" onClick={() => dispatch(setNumSnapshots(2))}>
        2
      </Dropdown.Item>
      <Dropdown.Item key="4" onClick={() => dispatch(setNumSnapshots(4))}>
        4
      </Dropdown.Item>
    </DropdownButton>
  );
}
export default NumSnapshotsDropDown;
