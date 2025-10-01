/* eslint-disable react/destructuring-assignment */
import React from 'react';

import elements from './elements.json';
import styles from './PeriodicTable.module.css';

export default class PeriodicTable extends React.Component {
  constructor(props) {
    super(props);
    this.onClickHandler = this.onClickHandler.bind(this);
    this.state = { selectedElement: null };
  }

  /**
   * @param {React.MouseEvent} event
   * */
  onClickHandler(event) {
    if (event.target.id) {
      this.props.onElementSelected(event.target.id, null);

      this.setState({ selectedElement: event.target.id });
    }
  }

  render() {
    const { availableElements } = this.props;
    const { selectedElement } = this.state;

    return (
      <div className={styles.periodic} onClick={this.onClickHandler}>
        {elements.map((element) => (
          <div
            key={element.name}
            id={element.symbol}
            className={styles.cell}
            data-available={
              availableElements.includes(element.symbol) || undefined
            }
            style={{
              gridColumn: element.column,
              gridRow: element.row,
            }}
          >
            <div
              data-altBg={element.altBg}
              data-selected={selectedElement === element.symbol || undefined}
              data-category={element.category}
              className={styles.element}
            >
              <div className={styles.atomicNumber}>{element.number}</div>
              <div className={styles.symbol}>{element.symbol}</div>
              <div className={styles.atomDetails}>
                {element.name}
                <br />
                {element.atomicMass}
              </div>
            </div>
          </div>
        ))}
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}
