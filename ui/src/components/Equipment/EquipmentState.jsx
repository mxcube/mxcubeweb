import { Alert } from 'react-bootstrap';

const VARIANTS = {
  READY: 'success',
  MOVING: 'warning',
  LOADING: 'warning',
  DISABLED: 'danger',
};

export default function EquipmentState(props) {
  const { state, equipmentName } = props;

  return (
    <Alert
      style={{
        margin: 0,
        width: 'inherit',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}
      variant={VARIANTS[state] || 'danger'}
    >
      {equipmentName} <b>{state}</b>
    </Alert>
  );
}
