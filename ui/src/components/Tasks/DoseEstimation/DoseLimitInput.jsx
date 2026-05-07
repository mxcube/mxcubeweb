import { useState } from 'react';
import { Col, Form, ListGroup, Row } from 'react-bootstrap';

import styles from './DoseLimitInput.module.css';

/**
 * @typedef {Object} StaticGoal
 * @property {'static'} type
 * @property {string} label
 * @property {number} mgy - Fixed dose-limit value in MGy.
 */

/**
 * @typedef {Object} ResolutionDependentGoal
 * @property {'resolution_dependent'} type
 * @property {string} label
 * @property {number} mgy_per_angstrom - Multiplied by the current resolution
 *   (Å) to derive the dose-limit in MGy.
 */

/** @typedef {StaticGoal | ResolutionDependentGoal} ExperimentalGoal */

/**
 * Resolves a goal's dose-limit (MGy).
 *
 * Resolution-dependent goals scale linearly with the user's resolution
 * input.
 *
 * @param {ExperimentalGoal} goal
 * @param {string | number} resolution - Current resolution in Å.
 * @returns {number}
 */
export function computeLimit(goal, resolution) {
  if (goal.type === 'static') {
    return goal.mgy;
  }
  return Number.parseFloat(resolution) * goal.mgy_per_angstrom;
}

/**
 * @typedef {Object} DoseLimitInputProps
 * @property {string} currentGoalId - id of the current experimental goal.
 * @property {Object.<string, ExperimentalGoal>} goals - dose limit presets.
 * @property {(string | null) => void} onGoalChange - callback for experimental goal changes.
 * @property {number | undefined} value - Current dose-limit value
 *  from the form.
 * @property {(limitMgy: number | undefined) => void} onLimitChange - Invoked on change of
 * dose limit value.
 * @property {string | number} resolution - Current resolution (Å), used to
 *  compute the limit for `resolution_dependent` goals.
 */

/**
 * Combobox for selecting an experimental dose-limit preset.
 *
 * @param {DoseLimitInputProps} props
 */
export function DoseLimitInput({
  currentGoalId,
  goals,
  onGoalChange,
  value,
  onLimitChange,
  resolution,
}) {
  const [showList, setShowList] = useState(false);

  return (
    <Form.Group>
      <Row>
        <Form.Label column sm={6}>
          <div>Dose limit (MGy)</div>
          {goals[currentGoalId] && (
            <div className={styles.goalLabel}>{goals[currentGoalId].label}</div>
          )}
        </Form.Label>
        <Col sm={5}>
          <div className={styles.wrapper}>
            <Form.Control
              type="number"
              value={value}
              onChange={(event) => {
                onLimitChange(event.target.value);
                onGoalChange(null);
              }}
              onClick={() => setShowList(true)}
              onFocus={() => setShowList(true)}
              onBlur={() => {
                setShowList(false);
              }}
            />
            {showList && (
              <ListGroup className={styles.list}>
                {Object.entries(goals).map(([goalId, goal]) => (
                  <ListGroup.Item
                    key={goalId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      const newLimit = computeLimit(goal, resolution);
                      onLimitChange(newLimit);
                      onGoalChange(goalId);
                    }}
                  >
                    <div className="text-center">
                      <div className={styles.goalLabel}>{goal.label}</div>
                      <div className={styles.goalValue}>
                        {computeLimit(goal, resolution).toFixed(2)}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Col>
      </Row>
    </Form.Group>
  );
}
