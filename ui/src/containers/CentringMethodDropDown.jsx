import { Dropdown, DropdownButton } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setCentringMethod } from '../actions/queue';
import { CENTRING_METHOD } from '../constants';

const CENTRING_METHOD_OPTIONS = [
  { value: CENTRING_METHOD.MANUAL, label: 'Manual (click) centring' },
  { value: CENTRING_METHOD.LOOP, label: 'Auto loop centring' },
  { value: CENTRING_METHOD.FULLY_AUTOMATIC, label: 'Fully automatic centring' },
  { value: CENTRING_METHOD.NONE, label: 'No centring' },
];

function CentringMethodDropDown(props) {
  const { align } = props;

  const dispatch = useDispatch();
  const centringMethod = useSelector((state) => state.queue.centringMethod);

  const current = CENTRING_METHOD_OPTIONS.find(
    (option) => option.value === centringMethod,
  );

  return (
    <DropdownButton
      id="centringMethodDropDown"
      variant="outline-secondary"
      align={{ sm: align }}
      title={
        <span>
          <i className="fas fa-1x fa-crosshairs" /> &nbsp; Centring:{' '}
          {current ? current.label : 'Unknown'}
        </span>
      }
    >
      {CENTRING_METHOD_OPTIONS.map(({ value, label }) => (
        <Dropdown.Item
          key={value}
          active={value === centringMethod}
          onClick={() => dispatch(setCentringMethod(value))}
        >
          {label}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
}

export default CentringMethodDropDown;
