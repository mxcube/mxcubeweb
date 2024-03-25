import React from 'react';
import { Alert } from 'react-bootstrap';

export default function EquipmentState(props) {
  let titleBackground;

  switch (props.state) {
    case 'READY': {
      titleBackground = 'success';

      break;
    }
    case 'MOVING': {
      titleBackground = 'warning';

      break;
    }
    case 'LOADING': {
      titleBackground = 'warning';

      break;
    }
    case 'DISABLED': {
      titleBackground = 'danger';

      break;
    }
    default: {
      titleBackground = 'danger';
    }
  }

  return (
    <Alert style={props.style} variant={titleBackground}>
      {props.equipmentName} <b>{props.state}</b>
    </Alert>
  );
}
