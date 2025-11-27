import { Col, Container, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { executeCommand } from '../actions/beamline';
import GenericEquipment from '../components/Equipment/GenericEquipment';
import GenericEquipmentControl from '../components/Equipment/GenericEquipmentControl';
import Harvester from '../components/Equipment/Harvester';
import HarvesterMaintenance from '../components/Equipment/HarvesterMaintenance';
import PlateManipulator from '../components/Equipment/PlateManipulator';
import PlateManipulatorMaintenance from '../components/Equipment/PlateManipulatorMaintenance';
import SampleChanger from '../components/Equipment/SampleChanger';
import SampleChangerMaintenance from '../components/Equipment/SampleChangerMaintenance';

function EquipmentContainer() {
  const dispatch = useDispatch();

  const beamline = useSelector((state) => state.beamline);
  const scContents = useSelector((state) => state.sampleChanger.contents);
  const scState = useSelector((state) => state.sampleChanger.state);
  const haContents = useSelector((state) => state.harvester.contents);
  const haState = useSelector((state) => state.harvester.state);

  return (
    <Container fluid className="mt-3">
      <Row className="d-flex">
        <Col sm={12}>
          <GenericEquipment state={scState} name={scContents?.name} initialOpen>
            {scContents.name === 'PlateManipulator' ? (
              <Row className="row">
                <Col sm={6}>
                  <PlateManipulator />
                </Col>
                <Col sm={6}>
                  <PlateManipulatorMaintenance />
                </Col>
              </Row>
            ) : (
              <Row className="row">
                <Col sm={6}>
                  <SampleChanger />
                </Col>
                <Col sm={6}>
                  <SampleChangerMaintenance />
                </Col>
              </Row>
            )}
          </GenericEquipment>

          {haContents.use_harvester && (
            <GenericEquipment
              state={haState}
              name={haContents?.name}
              initialOpen
            >
              <Row className="row">
                <Col sm={9}>
                  <Harvester />
                </Col>
                <Col sm={3}>
                  <HarvesterMaintenance />
                </Col>
              </Row>
            </GenericEquipment>
          )}

          <Row>
            <Col sm={12}>
              {Object.entries(beamline.hardwareObjects)
                .filter(
                  ([, obj]) =>
                    !Array.isArray(obj.commands) &&
                    Object.values(obj.commands).length > 0,
                )
                .map(([key, obj]) => {
                  return (
                    <GenericEquipmentControl
                      key={key}
                      equipment={obj}
                      executeCommand={(...args) =>
                        dispatch(executeCommand(...args))
                      }
                    />
                  );
                })}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default EquipmentContainer;
