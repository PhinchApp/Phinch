import React, { Component } from 'react';

import styles from './Summary.css';

export default class StackedBar extends Component {
  render() {
    return (
      <div className={styles.info}>
        <div className={styles.segment}>
          <div className={`${styles.file} ${styles.summary}`}>
            {this.props.summary.name} ({this.props.summary.size})
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.segment}>
            <div className={`${styles.label} ${styles.summary}`}>Observations</div>
            <div className={`${styles.number} ${styles.summary}`}>
              {this.props.summary.observations.toLocaleString()}
            </div>
            <div className={`${styles.label} ${styles.summary}`}>TOTAL</div>
            <div className={`${styles.number} ${styles.summary}`}>
              {this.props.summary.observations.toLocaleString()}
            </div>
          </div>
          <div className={styles.segment}>
            <div className={`${styles.label} ${styles.summary}`}>Selected Samples</div>
            <div className={`${styles.number} ${styles.summary}`}>
              {`${this.props.datalength.toLocaleString()}`}
            </div>
            <div className={`${styles.label} ${styles.summary}`}>TOTAL</div>
            <div className={`${styles.number} ${styles.summary}`}>
              {`${this.props.summary.samples.toLocaleString()}`}
            </div>
          </div>
        </div>
      </div>
    );
  }
};