import { Col, Container, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { executeCommand } from '../actions/beamline';
import {
  abort as haAbort,
  harvestAndLoadCrystal,
  harvestCrystal,
  refresh as haRefresh,
} from '../actions/harvester';
import {
  abort,
  mountSample,
  refresh,
  scan,
  select,
  unmountSample,
} from '../actions/sampleChanger';
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
  const loadedSample = useSelector((state) => state.sampleChanger.loadedSample);
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
                  <SampleChanger
                    state={scState}
                    loadedSample={loadedSample}
                    select={(address) => dispatch(select(address))}
                    load={(address) => dispatch(mountSample(address))}
                    unload={() => dispatch(unmountSample())}
                    abort={() => dispatch(abort())}
                    scan={(container) => dispatch(scan(container))}
                    contents={scContents}
                    refresh={() => dispatch(refresh())}
                  />
                </Col>
                <Col sm={6}>
                  <SampleChangerMaintenance />
                </Col>
              </Row>
            )}
          </GenericEquipment>
          {haContents.use_harvester ? (
            <GenericEquipment
              state={haState}
              name={haContents?.name}
              initialOpen
            >
              <Row className="row">
                <Col sm={9}>
                  <Harvester
                    state={haState}
                    harvestCrystal={(address) =>
                      dispatch(harvestCrystal(address))
                    }
                    harvestAndLoadCrystal={(address) =>
                      dispatch(harvestAndLoadCrystal(address))
                    }
                    abort={() => dispatch(haAbort())}
                    contents={haContents}
                    handleRefresh={() => dispatch(haRefresh())}
                  />
                </Col>
                <Col sm={3}>
                  <HarvesterMaintenance />
                </Col>
              </Row>
            </GenericEquipment>
          ) : null}
          <Row>
            <Col sm={12}>
              {Object.entries(beamline.hardwareObjects).map(([key]) => {
                const obj = beamline.hardwareObjects[key];
                if (
                  !Array.isArray(obj.commands) &&
                  Object.values(obj.commands).length > 0
                ) {
                  return (
                    <GenericEquipmentControl
                      equipment={obj}
                      executeCommand={(...args) =>
                        dispatch(executeCommand(...args))
                      }
                      key={key}
                    />
                  );
                }
                return null;
              })}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default EquipmentContainer;
