import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';

import MotorInput from '../MotorInput/MotorInput';
import TwoAxisTranslationControl from '../MotorInput/TwoAxisTranslationControl';

import styles from './MotorControls.module.css';
import motorInputStyles from '../MotorInput/MotorInput.module.css';

function MotorControls() {
  const [showAll, setShowAll] = useState(false);

  const motorsProps = useSelector((state) =>
    state.uiproperties.sample_view.components.filter(
      ({ value_type }) => value_type === 'MOTOR',
    ),
  );

  const verticalMotorProps = motorsProps.find(
    (c) => c.role === 'sample_vertical',
  );
  const horizontalMotorProps = motorsProps.find(
    (c) => c.role === 'sample_horizontal',
  );

  if (!verticalMotorProps || !horizontalMotorProps) {
    return motorsProps.map(({ role }) => <MotorInput key={role} role={role} />);
  }

  return (
    <>
      {motorsProps.slice(0, 3).map(({ role }) => (
        <MotorInput key={role} role={role} />
      ))}

      <div className={motorInputStyles.container}>
        <p className={`${motorInputStyles.label} mb-1`}>Sample alignment</p>
        <TwoAxisTranslationControl
          verticalMotorProps={verticalMotorProps}
          horizontalMotorProps={horizontalMotorProps}
        />
      </div>

      <Button
        className={styles.showAllBtn}
        size="sm"
        variant="outline-secondary"
        onClick={() => setShowAll(!showAll)}
      >
        <i className="fas fa-cogs me-2" />
        <span className="flex-fill">
          {showAll ? 'Hide motors' : 'Show motors'}
        </span>
        <i
          className={`fas ${showAll ? 'fa-caret-up' : 'fa-caret-down'} ms-2`}
        />
      </Button>

      {showAll &&
        motorsProps
          .slice(3)
          .map(({ role }) => <MotorInput key={role} role={role} />)}
    </>
  );
}

export default MotorControls;
