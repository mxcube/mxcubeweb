/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Col } from 'react-bootstrap';
import { connect } from 'react-redux';

import { filterAction } from '../actions/sampleGrid';
import styles from './SampleIsaraView.module.css';

class NewSampleIsaraView extends React.Component {
  constructor(props) {
    super(props);

    this.isPuckSelected = this.isPuckSelected.bind(this);
    this.sampleChangerRadius = 10;
    this.containerRadius = 1;
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown, false);
  }

  isPuckSelected(puck) {
    let isPuckSelected = false;
    if (Number(this.props.filterOptions.puckFilter) === puck) {
      isPuckSelected = true;
    }
    return isPuckSelected;
  }

  getContainerCoordinates(_cell, position) {
    const r = this.sampleChangerRadius / 8;
    const x = this.getX(position) + 10;
    const y = this.getY(position) + 10;
    const txtYDiff = 0.4 - this.sampleChangerRadius * 0.16;
    return { x, y, r, xtxt: x, ytxt: y + txtYDiff };
  }

  getX(position) {
    const drawingPosition = this.getDrawingPosition(position);
    if (drawingPosition.nbColumn === 5) {
      return [
        -this.sampleChangerRadius * 0.6,
        -this.sampleChangerRadius * 0.3,
        0,
        this.sampleChangerRadius * 0.3,
        this.sampleChangerRadius * 0.6,
      ][drawingPosition.column];
    }
    if (drawingPosition.nbColumn === 6) {
      return [
        -this.sampleChangerRadius * 0.75,
        -this.sampleChangerRadius * 0.45,
        -this.sampleChangerRadius * 0.15,
        this.sampleChangerRadius * 0.15,
        this.sampleChangerRadius * 0.45,
        this.sampleChangerRadius * 0.75,
      ][drawingPosition.column];
    }
    if (drawingPosition.nbColumn === 2) {
      return [
        -this.sampleChangerRadius * 0.15,
        this.sampleChangerRadius * 0.15,
      ][drawingPosition.column];
    }
    if (drawingPosition.nbColumn === 3) {
      return [
        -this.sampleChangerRadius * 0.3,
        this.sampleChangerRadius * 0,
        this.sampleChangerRadius * 0.3,
      ][drawingPosition.column];
    }
    if (drawingPosition.nbColumn === 1) {
      return [-this.sampleChangerRadius * 0][drawingPosition.column];
    }
    if (drawingPosition.nbColumn === 0) {
      return -1;
    }
    return 0;
  }

  getY(position) {
    const drawingPosition = this.getDrawingPosition(position);
    const minY = -this.sampleChangerRadius * 0.6;
    const lineStep = this.sampleChangerRadius * 0.28;
    if (drawingPosition.nbColumn === 1 || drawingPosition.nbColumn === 3) {
      return drawingPosition.line * lineStep + minY + 30;
    }
    if (drawingPosition.nbColumn === 0) {
      return -1;
    }
    return drawingPosition.line * lineStep + minY;
  }

  getDrawingPosition(position) {
    if (position < 5) {
      return { line: 0, column: position, nbColumn: 5 };
    }
    if (position < 11) {
      return { line: 1, column: position - 5, nbColumn: 6 };
    }
    if (position < 16) {
      return { line: 2, column: position - 11, nbColumn: 5 };
    }
    if (position < 22) {
      return { line: 3, column: position - 16, nbColumn: 6 };
    }
    if (position < 27) {
      return { line: 4, column: position - 22, nbColumn: 5 };
    }
    if (position < 30) {
      return { line: 5, column: position - 27, nbColumn: 2 };
    }

    return { line: 7, column: 0, nbColumn: 0 };
  }

  computePos(coord, position) {
    let maxPosition = 11;
    let radiusRatio = 0.76;
    if (position < 6) {
      maxPosition = 5;
      radiusRatio = 0.36;
    }

    const radius = radiusRatio * this.containerRadius;
    const step = (Math.PI * 2) / maxPosition;
    const angle = -(position - 1) * step;
    const x = Math.sin(angle) * radius + this.containerRadius + coord.x - 1;
    const y = this.containerRadius - Math.cos(angle) * radius + coord.y - 1;
    return { x, y };
  }

  createSample(pk, id, position) {
    const formattedNumber = id.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false,
    });

    const name = `${pk.toString()}:${formattedNumber}`;
    let color;
    const inQueue = this.props.queue.queue.includes(name);
    if (inQueue) {
      color = 'white';
    } else {
      color = 'black';
    }
    return (
      <g>
        <circle
          r="0.05"
          cx={position.x}
          cy={position.y}
          strokeWidth="0.1"
          stroke={color}
          fill="transparent"
        />
      </g>
    );
  }

  createSamples(coord, pk) {
    const samples = [];
    for (let id = 1; id < 17; id++) {
      const pos = this.computePos(coord, id);
      samples.push(this.createSample(pk, id, pos));
    }
    return samples;
  }

  createCircle(coord, pk) {
    return (
      <g>
        <circle
          r="1"
          cx={coord.x}
          cy={coord.y}
          id={pk}
          strokeWidth="0.1"
          stroke="black"
          fill="transparent"
        />
        {this.createSamples(coord, pk + 1)}
        <text
          x={coord.xtxt}
          y={coord.ytxt}
          textAnchor="middle"
          fontSize="0.6px"
        >
          {pk + 1}
        </text>
      </g>
    );
  }

  renderPucks(numPucks) {
    const allPucks = [];
    for (let pk = 0; pk < numPucks; pk++) {
      const coord = this.getContainerCoordinates(1, pk);
      allPucks.push(this.createCircle(coord, pk));
    }
    return allPucks;
  }

  render() {
    const numPucks = 29;

    return (
      <Col className="col-sm-2" style={{ marginTop: '25vh' }}>
        <div className={styles.divFlexPieCollapsible}>
          <div>
            <svg height="97%" width="97%" viewBox="0 0 20 20">
              <circle
                className={styles.mainCircleCenter}
                r="10"
                cx="10"
                cy="10"
              />
              <rect
                x="0"
                y="0"
                width="100%"
                height="1"
                stroke="white"
                fill="transparent"
                strokeWidth="2"
              />
              {this.renderPucks(numPucks)}
            </svg>
          </div>
        </div>
      </Col>
    );
  }
}

function mapStateToProps(state) {
  return {
    queue: state.queue,
    selected: state.sampleGrid.selected,
    sampleList: state.sampleGrid.sampleList,
    filterOptions: state.sampleGrid.filterOptions,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    filter: (filterOptions) => dispatch(filterAction(filterOptions)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewSampleIsaraView);
