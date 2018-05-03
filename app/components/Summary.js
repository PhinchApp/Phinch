import React, { Component } from 'react';

import styles from './Summary.css';

export default class StackedBar extends Component {
  render() {
    return (
      <table className={styles.info}>
        <tbody>
          <tr>
            <td className={`${styles.label} ${styles.summary}`}>File Name:</td>
            <td className={styles.summary}>{this.props.summary.name} ({this.props.summary.size})</td>
          </tr>
          <tr>
            <td className={`${styles.label} ${styles.summary}`}>Observations:</td>
            <td className={styles.summary}>{this.props.summary.observations.toLocaleString()}</td>
          </tr>
          <tr>
            <td className={`${styles.label} ${styles.summary}`}>Selected Samples:</td>
            <td className={styles.summary}>{`${this.props.datalength.toLocaleString()} / ${this.props.summary.samples.toLocaleString()}`}</td>
          </tr>
        </tbody>
      </table>
    );
  }
};