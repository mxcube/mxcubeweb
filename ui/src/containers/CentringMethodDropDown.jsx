import { Dropdown, DropdownButton } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { setCentringMethod } from '../actions/queue';
import { CENTRING_METHOD } from '../constants';

const CENTRING_METHOD_OPTIONS = [
  { name: 'MANUAL', label: 'Manual (click) centring' },
  { name: 'LOOP', label: 'Auto loop centring' },
  { name: 'FULLY_AUTOMATIC', label: 'Fully automatic centring' },
  { name: 'XRAY', label: 'X-ray centring' },
  { name: 'NONE', label: 'No centring' },
].map((option) => ({ ...option, value: CENTRING_METHOD[option.name] }));

function CentringMethodDropDown(props) {
  const { align } = props;

  const dispatch = useDispatch();
  const centringMethod = useSelector((state) => state.queue.centringMethod);
  const availableCentringOptions = useSelector(
    (state) => state.queue.availableCentringOptions,
  );
  const options = CENTRING_METHOD_OPTIONS.filter((option) =>
    availableCentringOptions.includes(option.name),
  );

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
      {options.map(({ value, label }) => (
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
