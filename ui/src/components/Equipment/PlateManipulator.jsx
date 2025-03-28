import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Button,
  ButtonToolbar,
  OverlayTrigger,
  Popover,
} from 'react-bootstrap';
import { contextMenu, Menu, Item, Separator } from 'react-contexify';

import { MdSync } from 'react-icons/md';
import styles from './equipment.module.css';
import TooltipTrigger from '../TooltipTrigger';

const strokeColor = 'rgb(136, 136, 136)';

export default function PlateManipulator(props) {
  const {
    state,
    global_state,
    crystalList,
    contents,
    selectedRow,
    selectedCol,
    selectedDrop,
    plates,
    plateIndex,
    loadedSample,
    refresh,
    showErrorPanel,
    setPlate,
    selectWell,
    selectDrop,
    inPopover,
    load,
    sendCommand,
    syncSamplesCrims,
  } = props;

  function showContextMenu(event, id) {
    let position = {
      x: event.clientX,
      y: event.clientY,
    };
    if (inPopover) {
      position = {
        x: event.offsetX,
        y: event.offsetY,
      };
    }

    contextMenu.show({
      id,
      event,
      position,
    });
  }

  function _setPlate() {
    let cplate_label = '';
    let plate_index = 0;
    if (global_state.plate_info?.plate_label) {
      cplate_label = global_state.plate_info.plate_label;
    }

    plates.forEach((cplate, index) => {
      if (cplate_label === cplate.name) {
        plate_index = index;
      }
    });

    setPlate(plate_index);
  }

  useEffect(() => {
    _setPlate();
  });

  function refreshClicked() {
    refresh();
  }

  // PlateManipulator: Check whether a drop contain crystal --?
  function hasCrystals() {
    let _crystalLists = [];

    if (loadedSample.address) {
      const _loadedSample = loadedSample.address;
      const loadedRow = _loadedSample.charAt(0);
      let loadedCol = _loadedSample.charAt(1);
      let loadedDrop = Number(_loadedSample.charAt(3), 10);
      if (loadedDrop === ':') {
        loadedDrop = _loadedSample.charAt(4);
        loadedCol = Number(_loadedSample.slice(1, 2), 10);
      }
      if (crystalList.xtal_list) {
        _crystalLists = crystalList.xtal_list.filter(
          (item) =>
            item.row === loadedRow &&
            item.column === Number(loadedCol) &&
            item.shelf === loadedDrop,
        );
      }
    }

    return _crystalLists.length > 0;
  }

  function getCrystalAddress(row, col) {
    let crystal = null;
    if (crystalList) {
      const items = crystalList.xtal_list;
      if (items) {
        items.forEach((item) => {
          if (item.row === row && item.column === col) {
            crystal = item;
          }
        });
      }
    }
    return crystal;
  }

  function getCrystalAddressByDrop(row, col, drop) {
    let crystal = null;
    if (crystalList) {
      const items = crystalList.xtal_list;
      if (items) {
        items.forEach((item) => {
          if (item.row === row && item.column === col && item.shelf === drop) {
            crystal = item;
          }
        });
      }
    }
    return crystal;
  }

  function initLoadSample(rowIdx, colIdx, row, col) {
    load({
      sampleID: `${row}${col}:${1}-0`,
      location: `${row}${col}:${1}-0`,
      row: rowIdx,
      col: colIdx,
      dropID: 1,
    });
  }

  function loadSample(drop) {
    if (selectedRow !== null) {
      load({
        sampleID: `${selectedRow}${selectedCol}:${drop}-0`,
        location: `${selectedRow}${selectedCol}:${drop}-0`,
        row: selectedRow,
        col: selectedCol,
        dropID: drop,
      });
    } else {
      showErrorPanel(
        true,
        'There is no selected Well \n Please select a well first',
      );
      setTimeout(() => {
        showErrorPanel(false, '');
      }, 2000);
    }
  }

  const plate = plates[plateIndex];
  const nbcols = plate.colTitle.length;
  const nbrows = plate.rowTitle.length;
  let loadedDrop = '';

  if (loadedSample.address) {
    loadedDrop = loadedSample.address.charAt(3);

    if (loadedDrop === ':') {
      loadedDrop = loadedSample.address.charAt(4);
    }
  }

  function crimsImg(imgUrl, name) {
    return (
      <div className={styles.plateDesc}>
        <img className={styles.plateTooltip} src={imgUrl} alt={name} />
      </div>
    );
  }

  const crystalForSelectedWell = getCrystalAddressByDrop(
    selectedRow,
    selectedCol,
    selectedDrop,
  );

  const _numberOfDrops = Array.from(
    { length: plate.numberOfDrops },
    (_, i) => i + 1,
  );

  function renderWellPlateInner(comp, x, y, x1, y1, d) {
    return _numberOfDrops.map((drop) => (
      <Button
        variant="light"
        as={comp}
        key={`key-${drop}-tr`}
        className={styles.innerPlate}
        onContextMenu={(e) => showContextMenu(e, `drop-${selectedDrop}-tr`)}
      >
        <rect
          width={plate.dropWidth}
          height={plate.dropHeight}
          x={x}
          y={y - d * drop}
          style={{
            fill: Number(loadedDrop) === drop ? '#ef9a9a' : '#9e9e9e',
            stroke: drop === selectedDrop ? '#0177fdad' : '#888888',
            strokeWidth: drop === selectedDrop ? '3' : '1',
          }}
          onClick={() => {
            selectDrop(drop);
          }}
          onContextMenu={() => {
            selectDrop(drop);
          }}
          onDoubleClick={() => {
            loadSample(drop);
          }}
        />
        <text
          x={x1}
          y={y1 - d * drop}
          transform={`rotate(${-plate.rotation}, ${x1}, ${y1 - d * drop - 5})`}
          style={{
            fontSize: `${plate.dropWidth / 2}px`,
            stroke:
              crystalForSelectedWell !== null
                ? crystalForSelectedWell.shelf === drop
                  ? 'green'
                  : '#ffffff'
                : '#ffffff',
          }}
          onClick={() => {
            selectDrop(drop);
          }}
          onContextMenu={() => {
            selectDrop(drop);
          }}
          onDoubleClick={() => {
            loadSample(drop);
          }}
        >
          {drop}
        </text>
      </Button>
    ));
  }

  let dropPosy = 0;
  if (plate.name === 'Crystal QuickX') {
    dropPosy = 95;
  } else if (plate.name === 'Greiner Impact 1536') {
    dropPosy = 135;
  } else {
    dropPosy = 70;
  }

  function renderWellPlate() {
    return (
      <div
        className={styles.plate}
        style={{ display: 'grid', paddingTop: '5px' }}
      >
        <div className={styles.plateDesc} style={{ display: 'grid' }}>
          <div>Currently loaded :{loadedSample.address}</div>
          <Menu id={`drop-${selectedDrop}-tr`}>
            <Item
              onClick={() => {
                loadSample(selectedDrop);
              }}
            >
              Move to drop {selectedDrop}
            </Item>
            {crystalForSelectedWell?.shelf === selectedDrop && (
              <>
                <Separator />
                <Item
                  onClick={() =>
                    sendCommand(
                      'moveToCrystalPosition',
                      crystalForSelectedWell.crystal_uuid,
                    )
                  }
                >
                  Move to Crystal Position
                </Item>
              </>
            )}
          </Menu>
          {crystalForSelectedWell?.shelf === selectedDrop &&
            crimsImg(
              crystalForSelectedWell.image_url,
              crystalForSelectedWell.sample,
            )}
          {plate.name === 'ChipX' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${4}, ${Math.floor(100 / 4)}%)`,
                gridTemplateRows: `repeat(${5}, 1fr)`,
                width: 240,
                height: 240,
                marginTop: 15,
                border: '1px solid #888888',
                padding: '15px 0 10px 20px',
                transform: `rotate(${plate.rotation})`,
              }}
            >
              {renderWellPlateInner('svg', 0, 0, 5, 15, 0)}
            </div>
          ) : (
            <svg
              id="wellPlateRef"
              className={styles.single_well}
              width={plate.name.includes('InSitu-1') ? 220 : 240}
              height={240}
              transform={`rotate(${plate.rotation})`}
            >
              {plate.wellOption.map((wo, idx) => (
                <rect
                  key={`wellplate-${wo.color}`}
                  width={
                    (120 * plate.wellOption.length) / (idx + 1) -
                    (plate.name.includes('InSitu-1') ? 20 : 0)
                  }
                  height={225}
                  x={0}
                  style={{
                    fill: wo.color,
                    strokeWidth: '1',
                    stroke: strokeColor,
                  }}
                />
              ))}
              {renderWellPlateInner(
                'g',
                120 * plate.wellOption.length - 75,
                235,
                120 * plate.wellOption.length - 60,
                258,
                dropPosy,
              )}
            </svg>
          )}
        </div>
      </div>
    );
  }

  function renderPlateGrid() {
    return (
      <div className={styles.plate} style={{ paddingTop: '5px' }}>
        <div
          className={styles.colHeader}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${nbcols}, 1fr)`,
            marginLeft: 25,
          }}
        >
          {plate.colTitle.map((col) => (
            <span
              key={`col-${col}`}
              style={{
                textAlign: 'center',
                width: plate.wellWidth,
                height: 25,
              }}
            >
              {col}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex' }}>
          {/* Plate header Row */}
          <div
            className={styles.rowHeader}
            style={{
              display: 'grid',
              height: '230px',
              gridTemplateRows: `repeat(${nbrows}, 1fr)`,
            }}
          >
            {plate.rowTitle.map((row) => (
              <span
                key={`row-${row}`}
                className={styles.rowlist}
                style={{
                  marginRight: 10,
                  marginTop: 2,
                  height: plate.wellHeight,
                }}
              >
                {row}
              </span>
            ))}
          </div>
          {plate.name !== 'ChipX' ? (
            <div
              style={{
                width: '400px',
                display: 'grid',
                gridTemplateColumns: `repeat(${nbcols}, 1fr)`,
              }}
            >
              {plate.rowTitle.map((row, rowIdx) =>
                plate.colTitle.map((col, colIdx) => {
                  let cell = null;
                  const crystal = getCrystalAddress(row, col);
                  if (contents.children !== null) {
                    if (plate.type === 'square') {
                      cell = (
                        <div
                          onContextMenu={(e) =>
                            showContextMenu(e, `wls${row}${col}`)
                          }
                          key={`cell-${row}${col}`}
                        >
                          <svg
                            className={styles.single_well}
                            width={plate.wellWidth}
                            height={plate.wellHeight}
                            strokeWidth={
                              `${row}${col}` === `${selectedRow}${selectedCol}`
                                ? '2'
                                : '1'
                            }
                            stroke={
                              `${row}${col}` === `${selectedRow}${selectedCol}`
                                ? '#0177fdad'
                                : strokeColor
                            }
                            onDoubleClick={() => {
                              initLoadSample(rowIdx, colIdx, row, col);
                            }}
                            onClick={() => {
                              selectWell(row, col);
                            }}
                            onContextMenu={() => {
                              selectWell(row, col);
                            }}
                          >
                            <rect
                              width={plate.wellWidth}
                              height={plate.wellHeight}
                              x={0}
                              style={{
                                fill: crystal !== null ? '#81c784' : '#eeeeee',
                              }}
                            />
                            <rect
                              width={plate.wellWidth / 2}
                              height={plate.wellHeight}
                              x={1}
                              style={{
                                fill:
                                  `${row}${col}:${loadedDrop}-0` ===
                                  loadedSample.address
                                    ? '#e57373'
                                    : '#e0e0e0',
                              }}
                            />
                          </svg>
                          <Menu
                            id={`wls${row}${col}`}
                            className={styles.context_menu_provider}
                          >
                            <li className="dropdown-header">
                              <b>
                                Well {row}
                                {col} :{loadedDrop}
                              </b>
                            </li>
                            <Separator />
                            <Item
                              onClick={() => {
                                initLoadSample(rowIdx, colIdx, row, col);
                              }}
                            >
                              Move to this Well
                            </Item>
                            {crystal !== null && (
                              <>
                                <Separator />
                                <b>Crystal Info : </b>
                                <ul>
                                  <li>Sample : {crystal.sample}</li>
                                  <li>Drop : {crystal.shelf}</li>
                                </ul>
                              </>
                            )}
                          </Menu>
                        </div>
                      );
                    } else {
                      cell = 'Not Implemented';
                    }
                  }
                  return cell;
                }),
              )}
            </div>
          ) : (
            <div
              className="grid"
              style={{
                height: '230px',
                display: 'grid',
                gridTemplateColumns: `repeat(${nbcols}, 1fr)`,
              }}
            >
              {plate.rowTitle.map((row, rowIdx) =>
                plate.colTitle.map((col, colIdx) => {
                  let cell = null;
                  const crystal = getCrystalAddress(row, col);
                  if (contents.children !== null) {
                    if (plate.type === 'square') {
                      cell = (
                        <div
                          onContextMenu={(e) =>
                            showContextMenu(e, `wlw${row}${col}`)
                          }
                          key={`cell-${row}${col}`}
                        >
                          <svg
                            className={styles.single_well}
                            width={plate.wellWidth}
                            height={plate.wellHeight}
                            strokeWidth={
                              `${row}${col}` === `${selectedRow}${selectedCol}`
                                ? '2'
                                : '1'
                            }
                            stroke={
                              `${row}${col}` === `${selectedRow}${selectedCol}`
                                ? '#0177fdad'
                                : strokeColor
                            }
                            onDoubleClick={() => {
                              initLoadSample(rowIdx, colIdx, row, col);
                            }}
                            onClick={() => {
                              selectWell(row, col);
                            }}
                            onContextMenu={() => {
                              selectWell(row, col);
                            }}
                          >
                            <rect
                              width={plate.wellWidth}
                              height={plate.wellHeight}
                              x={0}
                              style={{
                                fill:
                                  `${row}${col}:${loadedDrop}-0` ===
                                  loadedSample.address
                                    ? '#e57373'
                                    : '#e0e0e0',
                              }}
                            />
                            <rect
                              width={plate.wellWidth - 20}
                              height={plate.wellHeight - 20}
                              x={10}
                              y={10}
                              style={{
                                fill: crystal !== null ? '#81c784' : '#eeeeee',
                              }}
                            />
                          </svg>
                          <Menu
                            id={`wlw${row}${col}`}
                            className={styles.context_menu_provider}
                          >
                            <li className="dropdown-header">
                              <b>
                                Well {row} {col} :{loadedDrop}
                              </b>
                            </li>
                            <Separator />
                            <Item
                              onClick={() => {
                                initLoadSample(rowIdx, colIdx, row, col);
                              }}
                            >
                              Move to this Well
                            </Item>
                            {crystal !== null && (
                              <>
                                <Separator />
                                <b>Crystal Info : </b>
                                <ul>
                                  <li>Sample : {crystal.sample}</li>
                                  <li>Drop : {crystal.shelf}</li>
                                </ul>
                              </>
                            )}
                          </Menu>
                        </div>
                      );
                    } else {
                      cell = 'Not Implemented';
                    }
                  }
                  return cell;
                }),
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  let cplate_label = '';
  if (global_state.plate_info && global_state.plate_info.plate_label) {
    cplate_label = global_state.plate_info.plate_label;
  }
  let cssDisable = {};
  if (state === 'MOVING') {
    cssDisable = { cursor: 'wait', pointerEvents: 'none', opacity: '0.5' };
  }

  function renderPlate() {
    return (
      <Row
        className="mt-4"
        title={state === 'MOVING' ? 'Plate Moving, can not send commande' : ''}
      >
        <Col className="ms-3">
          <ButtonToolbar className="ms-4">
            {!inPopover && (
              <div className="me-4">
                <b>{cplate_label}</b>
              </div>
            )}
            <TooltipTrigger
              id="refresh-tooltip"
              tooltipContent="Refresh if plate location not updated"
            >
              <Button size="sm" variant="outline-info" onClick={refreshClicked}>
                <MdSync size="1.5em" /> Refresh
              </Button>
            </TooltipTrigger>
            <span style={{ marginLeft: '1.5em' }} />
            <TooltipTrigger
              id="sync-samples-tooltip"
              tooltipContent="Synchronise sample list with CRIMS"
            >
              <Button
                size="sm"
                variant="outline-success"
                onClick={syncSamplesCrims}
              >
                <MdSync size="1.5em" /> CRIMS
              </Button>
            </TooltipTrigger>
          </ButtonToolbar>
        </Col>
        <div className={styles.plate_div} style={cssDisable}>
          <div className={styles.plate_grid}>{renderPlateGrid()}</div>
          <div>
            <div className={styles.plate_info}>
              <Button variant="outline-secondary" style={{ float: 'right' }}>
                <span className={styles.is_loaded_info}>loaded</span>
                <span className={styles.has_crystal_info}>Crystal</span>
                <span className={styles.empty_well_info}>Empty</span>
              </Button>
            </div>
            {renderWellPlate()}
          </div>
        </div>
      </Row>
    );
  }

  if (!inPopover) {
    return renderPlate();
  }
  return (
    <div className="mb-4">
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="auto-end"
        overlay={
          <Popover id="platePopover" style={{ maxWidth: '800px' }}>
            <Popover.Header>
              {global_state.plate_info.plate_label}
            </Popover.Header>
            <Popover.Body style={{ padding: 0 }}>{renderPlate()}</Popover.Body>
          </Popover>
        }
      >
        <Button
          variant="outline-secondary"
          style={{
            marginTop: '1em',
            minWidth: '155px',
            width: 'fit-conent',
            whiteSpace: 'nowrap',
          }}
          size="sm"
        >
          <i className="fa fa-th" /> Plate Navigation
          <i className="fa fa-caret-right" />
        </Button>
      </OverlayTrigger>
      <Button
        style={{
          marginTop: '1em',
          minWidth: '155px',
          width: 'fit-conent',
          whiteSpace: 'nowrap',
        }}
        variant="outline-secondary"
        size="sm"
        title={
          hasCrystals()
            ? 'Move to Crystal position'
            : 'No Crystal Found / Crims not Sync'
        }
        onClick={() => sendCommand('moveToCrystalPosition')}
        disabled={!hasCrystals()}
      >
        <i className="fas fa-gem" /> Move to Crystal
      </Button>
    </div>
  );
}
