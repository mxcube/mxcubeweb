/* eslint-disable no-nested-ternary */
import React from 'react';
import {
  Row, Col, Button, Dropdown, DropdownButton, ButtonToolbar,
  OverlayTrigger, Tooltip
} from 'react-bootstrap';
import {
    contextMenu, Menu, Item, Separator,
} from 'react-contexify';

import { MdSync } from "react-icons/md";

class PlateManipulator extends React.Component {
  constructor(props) {
    super(props);
    this.setPlate = this.setPlate.bind(this);
    this.loadSample = this.loadSample.bind(this);
    this.initLoadSample = this.initLoadSample.bind(this);
    this.syncSamplesCrims = this.syncSamplesCrims.bind(this);
    this.showContextMenu = this.showContextMenu.bind(this);
    this.refreshClicked = this.refreshClicked.bind(this);
    this.wellPlateRef = React.createRef();
  }

  componentDidMount() {
    this.setPlate();
  }

  showContextMenu(event, id) {
    event.stop
    let position= {
      x: event.clientX,
      y: event.clientY ,
    }
    if(this.props.inPopover) {
      position= {
        x: event.offsetX,
        y: event.offsetY,
      }
    }

    contextMenu.show({
      id,
      event: event,
      position: position,
    });
  }

  setPlate() {
    let plate_label = '';
    let plate_index = 0;
    if (this.props.global_state.plate_info && this.props.global_state.plate_info.plate_label) {
      plate_label = this.props.global_state.plate_info.plate_label;
    }
    this.props.plates.map((cplate, index) => {
      if (plate_label === cplate.name) {
        plate_index = index
      }
    });

    this.props.setPlate(plate_index);
  }

  refreshClicked() {
    this.props.refresh();
  }




  getCrystalAddress(row, col) {
    let crystal = null;
    if (this.props.crystalList.xtal_list) {
      const items = this.props.crystalList.xtal_list;
      items.forEach((item) => {
        if (item.row === row && item.column === col) {
          crystal = item;
        }
      });
    }
    return crystal;
  }

  getCrystalAddressByDrop(row, col, drop) {
    let crystal = null;
    if (this.props.crystalList.xtal_list) {
      const items = this.props.crystalList.xtal_list;
      items.forEach((item) => {
        if (item.row === row && item.column === col && item.shelf === drop) {
          crystal = item;
        }
      });
    }
    return crystal;
  }

  initLoadSample(rowIdx, colIdx, row, col) {
    this.props.load({
      sampleID: `${row}${col}:${1}-0`,
      location: `${row}${col}:${1}-0`,
      row: rowIdx,
      col: colIdx,
      dropID: 1
    });
  }

  syncSamplesCrims() {
    this.props.syncSamplesCrims();
  }


  loadSample(drop) {
    if (this.props.selectedRow !== null) {
      this.props.load({
        sampleID: `${this.props.selectedRow}${this.props.selectedCol}:${drop}-0`,
        location: `${this.props.selectedRow}${this.props.selectedCol}:${drop}-0`,
        row: this.props.selectedRow,
        col: this.props.selectedCol,
        dropID: drop
      });
    }
    else {
      this.props.generalActions.showErrorPanel(true, 'There is no selected Well \n Please select a well first');
      setTimeout(() => { this.props.generalActions.showErrorPanel(false, ''); }, 2000);
    }
  }


  render() {
    const plate = this.props.plates[this.props.plateIndex];
    // const plateName = this.props.global_state.plate_info.plate_label
    // const plate = this.props.plates.filter(_plate => _plate.name == plateName)[0];
    const nbcols = plate.colTitle.length;
    const nbrows = plate.rowTitle.length;
    let loadedDrop = '';

    if (this.props.loadedSample.address) {
      loadedDrop = this.props.loadedSample.address.charAt(3);

      if (loadedDrop === ':') {
        loadedDrop = this.props.loadedSample.address.charAt(4);
      }
    }

    const crimsImg = (imgUrl, name) =>
      <div className="plate-desc">
        <img className="plate-tooltip" src={imgUrl} alt={name}/>
      </div>;


    const crystalForSelectedWell = this.getCrystalAddressByDrop(this.props.selectedRow,
      this.props.selectedCol, this.props.selectedDrop);
    const wellPlateInner = (comp, x, y, x1, y1, d) =>
      plate.numOfdrops.map(drop => (
        <Button
          variant='content'
          as={comp}
          key={`key-${drop}-tr`}
          style={{ width: 'fit-content', height: 'fit-content'}}
          onContextMenu={(e) => this.showContextMenu(e, `drop-${this.props.selectedDrop}-tr`)}
        >
          <rect
            width={plate.dropWidth}
            height={plate.dropHeight}
            x={x}
            y={y - d * drop}
            style={{
              // fill: `${this.props.selectedRow}${this.props.selectedCol}:${drop}-0` === this.props.loadedSample.address ? '#ef9a9a' : '#9e9e9e',
              fill: Number(loadedDrop) === drop ? '#ef9a9a' : '#9e9e9e',
              stroke: drop === this.props.selectedDrop ? '#0177fdad' : '#888888',
              strokeWidth: drop === this.props.selectedDrop ? '2' : '1',
            }}
            onClick={() => {
              this.props.selectDrop(drop);
            }}
            onContextMenu={() => {
              this.props.selectDrop(drop);

            }}
            onDoubleClick={() => {
              this.loadSample(drop);
            }}
          />
          <text
            x={x1}
            y={y1 - d * drop}
            // transform={`rotate(${plate.rotation})`}
            style={{
              fontSize: `${plate.dropWidth / 2 }px`,
              stroke: crystalForSelectedWell !== null ?
                crystalForSelectedWell.shelf === drop ?
                  'green' : '#ffffff'
                :
                '#ffffff'
              ,
            }}
            onClick={() => {
              this.props.selectDrop(drop);
            }}
            onContextMenu={() => {
              this.props.selectDrop(drop);
            }}
            onDoubleClick={() => {
              this.loadSample(drop);
            }}
          >
            {drop}
          </text>
        </Button>
      ));

    let dropPosy = 70;
    if(plate.name == "Cristal QuickX") {
      dropPosy = 95
    }
    else if(plate.name == "Greiner Impact 1536") {
      dropPosy = 135
    }
    const wellPlate = () =>
      <div className="plate" style={{ display: 'grid', paddingTop: '5px' }}>
        <div className="grid plate-desc" style={{ display: 'grid' }}>
          <div>
            Currently loaded :
            {this.props.loadedSample.address}
          </div>
          <Menu id={`drop-${this.props.selectedDrop}-tr`}>
            <Item
              onClick={() => {
                this.loadSample(this.props.selectedDrop);
              }}
            >
              Move to drop
              {' '}
              {this.props.selectedDrop}
            </Item>
            {
              crystalForSelectedWell !== null ?
                crystalForSelectedWell.shelf === this.props.selectedDrop ?
                  (
                  <>
                    <Separator />
                    <Item
                      onClick={() => this.props.send_command('moveToCrystalPosition', crystalForSelectedWell.crystal_uuid)}
                    >
                      Move to Crystal Position
                    </Item>
                  </>
                  ) : null
                : null
            }
          </Menu>
          {crystalForSelectedWell !== null ?
            crystalForSelectedWell.shelf === this.props.selectedDrop ?
              (
                crimsImg(crystalForSelectedWell.image_url, crystalForSelectedWell.sample)
              )
              : null
            :
            null
          }
          {plate.name === 'ChipX' ?
            (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${4}, ${Math.floor(100 / (4))}%)`,
                gridTemplateRows: `repeat(${5}, 1fr)`,
                width: 240,
                height: 240,
                marginTop: 15,
                border: '1px solid #888888',
                padding: '10px 0 0 10px',
                transform: `rotate(${plate.rotation})`
              }}
            >
              {wellPlateInner('svg', 0, 0, 5, 15,  0)}
            </div>
            )
            :
            (
            <svg
              ref={this.wellPlateRef}
              id="wellPlateRef"
              className="single_well"
              width={240}
              height={240}
              transform={`rotate(${plate.rotation})`}
            >
              {plate.wellOption.map((wo, idx) => (
                <rect
                  key={`wellplate-${idx}`}
                  width={120 * plate.wellOption.length / (idx + 1) - plate.welladjustWidth}
                  height={225}
                  x={0}
                  style={{ fill: wo.color, strokeWidth: '1', stroke: 'rgb(136, 136, 136)' }}
                />
              ))}
              {wellPlateInner('g', 120 * plate.wellOption.length - 75, 235, 120 * plate.wellOption.length - 60, 258, dropPosy)}
            </svg>
            )
          }
        </div>
      </div>;

    const plateGrid = () =>
      <div className="plate" style={{ paddingTop: '5px' }}>
        <div className="colHeader" style={{ display: 'grid', gridTemplateColumns: `repeat(${nbcols}, 1fr)`, marginLeft: 25 }}>
          {
            plate.colTitle.map(col => (
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
            ))
          }
        </div>
        <div style={{ display: 'flex' }}>
          {/* Plate header Row */}
          <div className="rowHeader" style={{ display: 'grid', height: '230px', gridTemplateRows: `repeat(${nbrows}, 1fr)` }}>
            {
              plate.rowTitle.map(row => (
                <span
                  key={`row-${row}`}
                  className="rowlist"
                  style={{
                    marginRight: 10,
                    marginTop: 2,
                    height: plate.wellHeight
                  }}
                >
                  {row}
                </span>
              ))
            }
          </div>
          {plate.name !== 'ChipX' ?
            (
            <div className="grid" style={{ width: '400px', height: '230px', display: 'grid', gridTemplateColumns: `repeat(${nbcols}, 1fr)` }}>
              {
                plate.rowTitle.map((row, rowIdx) => (
                  plate.colTitle.map((col, colIdx) => {
                    let cell = null;
                    const crystal = this.getCrystalAddress(row, col);
                    if (this.props.contents.children !== null) {
                      if (plate.type === 'square') {
                        cell = (
                          <div onContextMenu={(e) => this.showContextMenu(e, `wls${row}${col}`)} key={`cell-${row}${col}`}>
                            <svg
                              className="single_well"
                              width={plate.wellWidth}
                              height={plate.wellHeight}
                              strokeWidth={`${row}${col}` === `${this.props.selectedRow}${this.props.selectedCol}` ? '2' : '1' }
                              stroke={`${row}${col}` === `${this.props.selectedRow}${this.props.selectedCol}` ? '#0177fdad' : 'rgb(136, 136, 136)'}
                              onDoubleClick={() => {
                                this.initLoadSample(rowIdx, colIdx, row, col);
                              }}
                              onClick={() => {
                                this.props.selectWell(row, col);
                              }}
                              onContextMenu={() => {
                                this.props.selectWell(row, col);
                              }}
                            >
                              <rect
                                width={plate.wellWidth}
                                height={plate.wellHeight}
                                x={0}
                                style={{ fill: crystal !== null ? '#81c784' : '#eeeeee',
                                }}
                              />
                              <rect
                                width={plate.wellWidth / 2}
                                height={plate.wellHeight}
                                x={1}
                                style={{ fill: `${row}${col}:${loadedDrop}-0` === this.props.loadedSample.address ? '#e57373' : '#e0e0e0',
                                }}
                              />
                            </svg>
                            <Menu id={`wls${row}${col}`} className="context-menu-provider">
                              <li className="dropdown-header">
                                <b>
                                  Well
                                  {' '}
                                  {`${row}${col}`}
                                  {':'}
                                  {loadedDrop}
                                </b>
                              </li>
                              <Separator />
                              <Item
                                onClick={() => {
                                  this.initLoadSample(rowIdx, colIdx, row, col);
                                }}
                              >
                                Move to this Well
                              </Item>
                              { crystal !== null ? [
                              <Separator />,
                              <b>Crystal Info : </b>,
                              <ul>
                                <li>Sample : {crystal.sample}</li>
                                <li>Drop : {crystal.shelf}</li>
                              </ul>
                              ]
                                :
                                null
                            }
                            </Menu>
                          </div>
                        );
                      }
                    }
                    return cell;
                  })
                ))
              }
            </div>
            )
            :
            (
            <div className="grid" style={{ height: '230px', display: 'grid', gridTemplateColumns: `repeat(${nbcols}, 1fr)` }}>
              {
                plate.rowTitle.map((row, rowIdx) => (
                  plate.colTitle.map((col, colIdx) => {
                    let cell = null;
                    const crystal = this.getCrystalAddress(row, col);
                    if (this.props.contents.children !== null) {
                      if (plate.type === 'square') {
                        cell = (
                          <div onContextMenu={(e) => this.showContextMenu(e, `wlw${row}${col}`)} key={`cell-${row}${col}`}>
                            <svg
                              className="single_well"
                              width={plate.wellWidth}
                              height={plate.wellHeight}
                              strokeWidth={`${row}${col}` === `${this.props.selectedRow}${this.props.selectedCol}` ? '2' : '1' }
                              stroke={`${row}${col}` === `${this.props.selectedRow}${this.props.selectedCol}` ? '#0177fdad' : 'rgb(136, 136, 136)'}
                              onDoubleClick={() => {
                                this.initLoadSample(rowIdx, colIdx, row, col);
                              }}
                              onClick={() => {
                                this.props.selectWell(row, col);
                              }}
                            >
                              <rect
                                width={plate.wellWidth}
                                height={plate.wellHeight}
                                // stroke={`${row}${col}` === `${this.props.selectedRow}${this.props.selectedCol}` ? '#0177fdad' : 'rgb(136, 136, 136)'}
                                x={0}
                                style={{
                                  // stroke: crystal !== null ? '#81c784' : '#eeeeee',
                                  fill: `${row}${col}:${loadedDrop}-0` === this.props.loadedSample.address ? '#e57373' : '#e0e0e0'
                                }}
                              />
                            </svg>
                            <Menu id={`wlw${row}${col}`} className="context-menu-provider">
                              <li className="dropdown-header">
                                <b>
                                  Well
                                  {' '}
                                  {`${row}${col}`}
                                  {':'}
                                  {loadedDrop}
                                </b>
                              </li>
                              <Separator />
                              <Item
                                onClick={() => {
                                  this.initLoadSample(rowIdx, colIdx, row, col);
                                }}
                              >
                                Move to this Well
                              </Item>
                              { crystal !== null ? [
                              <Separator />,
                              <b>Crystal Info : </b>,
                              <ul>
                                <li>Sample : {crystal.sample}</li>
                                <li>Drop : {crystal.shelf}</li>
                              </ul>
                              ]
                                :
                                null
                            }
                            </Menu>
                        </div>
                        );
                      }
                    }
                    return cell;
                  })
                ))
              }
            </div>
            )
          }
        </div>
      </div>;

    let plate_label = '';
    if (this.props.global_state.plate_info && this.props.global_state.plate_info.plate_label) {
      plate_label = this.props.global_state.plate_info.plate_label;
    }
    let cssDisable = {};
    if (this.props.state === 'MOVING') {
      cssDisable = { cursor: 'wait', pointerEvents: 'none', opacity: '0.5'}
    }
    return (
      <Row className='mt-4' title={this.props.state === 'MOVING' ? 'Plate Moving, can not send commande' : ''}>
        <Col className='ms-3'>
          <ButtonToolbar className='ms-4'>
            {/* <DropdownButton
              variant="outline-secondary"
              title={plate_label}
              id="dropdown-basic"
              size='sm'
            >
              {this.props.plates.map((cplate, index) => (
                plate_label === cplate.name ?
                  (<Dropdown.Item
                    key={cplate.name}
                    onClick={() => {
                      this.setPlate(index);
                    }}
                  >
                    {cplate.name}
                  </Dropdown.Item>)
                  :
                  (<Dropdown.Item
                    key={cplate.name}
                    // onClick={() => {
                    //   this.setPlate(index);
                    // }}
                    disabled
                  >
                    {cplate.name}
                  </Dropdown.Item>)
              ))
              }
            </DropdownButton> */}
            {/* <span style={{ marginLeft: '1.5em' }} /> */}
            <OverlayTrigger
              variant="outline-success"
              placement="bottom"
              overlay={(
                <Tooltip id="select-samples">
                  Refresh if Plate Location not Updated
                </Tooltip>)}
            >
              <Button size='sm' variant="outline-info" onClick={this.refreshClicked}>
                <MdSync size='1.5em'/> Refresh
              </Button>
            </OverlayTrigger>
            <span style={{ marginLeft: '1.5em' }} />
            <OverlayTrigger
              variant="outline-success"
              placement="bottom"
              overlay={(
                <Tooltip id="select-samples">
                  Synchronise sample list with CRIMS
                </Tooltip>)}
            >
              <Button size='sm' variant="outline-success" onClick={this.syncSamplesCrims}>
                <MdSync size='1.5em'/> CRIMS
              </Button>
            </OverlayTrigger>
          </ButtonToolbar>
        </Col>
        <div
          className="plate-div" style={cssDisable}
        >
          <div className="plate-grid">
              {plateGrid()}
          </div>
          <div>
            <div className="plate-info">
              <Button variant='outline-secondary' className="" style={{ float: 'right' }} >
                <span className="is-loaded-info">
                  loaded
                </span>
                <span className="has-crystal-info">
                  Crystal
                </span>
                <span className="empty-well-info">
                  Empty
                </span>
              </Button>
            </div>
            {wellPlate()}
          </div>
        </div>
      </Row>
    );
  }
}

export default PlateManipulator;
