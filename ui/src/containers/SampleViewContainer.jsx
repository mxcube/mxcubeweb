import { Col, Container, Row } from 'react-bootstrap';
import { useSelector } from 'react-redux';

import PlateManipulator from '../components/Equipment/PlateManipulator';
import motorInputStyles from '../components/MotorInput/MotorInput.module.css';
import ApertureInput from '../components/SampleView/ApertureInput';
import ContextMenu from '../components/SampleView/ContextMenu';
import MotorControls from '../components/SampleView/MotorControls';
import { NStateSelect } from '../components/SampleView/NStateSelect';
import PhaseInput from '../components/SampleView/PhaseInput';
import SampleImage from '../components/SampleView/SampleImage';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import DefaultErrorBoundary from './DefaultErrorBoundary';
import SampleQueueContainer from './SampleQueueContainer';
import styles from './SampleViewContainer.module.css';

function getShapes(shapes, type) {
  return Object.fromEntries(
    Object.entries(shapes).filter(([_, shape]) => shape.t === type),
  );
}

function SampleViewContainer() {
  const shapes = useSelector((state) => state.shapes.shapes) || {};
  const uiproperties = useSelector((state) => state.uiproperties);
  const hardwareObjects = useSelector(
    (state) => state.beamline.hardwareObjects,
  );
  const sampleChangerContents = useSelector(
    (state) => state.sampleChanger.contents,
  );

  if (!('sample_view_motors' in uiproperties)) {
    return null;
  }

  const { components } = uiproperties?.sample_view ?? [];

  const phaseControl = components.find((c) => c.attribute === 'phase_control');
  const beamSize = components.find((c) => c.attribute === 'beam_size');

  const nStates = new Set(
    Object.entries(hardwareObjects)
      .filter(([_, ho]) => ho.type === 'NSTATE')
      .map(([name, _]) => name),
  );
  const nStatesComponents =
    components.filter((component) => nStates.has(component.attribute)) ?? [];

  const points = getShapes(shapes, 'P');
  const twoDPoints = getShapes(shapes, '2DP');
  const lines = getShapes(shapes, 'L');
  const grids = getShapes(shapes, 'G');
  const selectedGrids = Object.values(grids).filter((s) => s.selected);

  return (
    <Container className="d-flex flex-column" fluid>
      <Row
        style={{
          flex: 'none',
          background: '#fafafa',
          borderBottom: '1px solid lightgray',
          paddingBottom: '0em',
        }}
      >
        <Col sm={12}>
          <DefaultErrorBoundary>
            <BeamlineSetupContainer />
          </DefaultErrorBoundary>
        </Col>
      </Row>

      <Row className="flex-grow-1 gx-3 py-3">
        <Col sm={2} xxl={1} className={styles.controllers}>
          <DefaultErrorBoundary>
            {phaseControl !== undefined && (
              <div className={motorInputStyles.container}>
                <label className={motorInputStyles.label} htmlFor="PhaseInput">
                  {phaseControl.label}
                </label>
                <PhaseInput />
              </div>
            )}
            {beamSize !== undefined && (
              <div className={motorInputStyles.container}>
                <label
                  className={motorInputStyles.label}
                  htmlFor="ApertureInput"
                >
                  {beamSize.label}
                </label>
                <ApertureInput />
              </div>
            )}
            {nStatesComponents.map((component) => (
              <div
                className={motorInputStyles.container}
                key={component.attribute}
              >
                <label
                  className={motorInputStyles.label}
                  htmlFor={component.attribute}
                >
                  {component.label || component.attribute}
                </label>
                <NStateSelect
                  name={component.attribute}
                  id={component.attribute}
                />
              </div>
            ))}
            {sampleChangerContents.name === 'PlateManipulator' && (
              <PlateManipulator inPopover />
            )}

            <MotorControls />
          </DefaultErrorBoundary>
        </Col>

        <Col sm={6}>
          <DefaultErrorBoundary>
            <ContextMenu />
            <SampleImage
              points={points}
              twoDPoints={twoDPoints}
              lines={lines}
              grids={grids}
              selectedGrids={selectedGrids}
            />
          </DefaultErrorBoundary>
        </Col>

        <Col className={styles.queue} sm={4} xxl={5}>
          <DefaultErrorBoundary>
            <SampleQueueContainer />
          </DefaultErrorBoundary>
        </Col>
      </Row>
    </Container>
  );
}
export default SampleViewContainer;
