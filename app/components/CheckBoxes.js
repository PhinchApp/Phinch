import React, { Component } from 'react';

import styles from './CheckBoxes.css';

export default class CheckBoxes extends Component {
  render() {
    const buttons = this.props.filter.expanded ? (
      <div>
        <div
          className={styles.toggleText}
          onClick={() => this.props.setAll(this.props.name, true)}
        >
          all
        </div>
        <div
          className={styles.toggleText}
          onClick={() => this.props.setAll(this.props.name, false)}
        >
          none
        </div>
      </div>
    ) : '';
    const boxes = this.props.filter.expanded ? (
      this.props.data.values.map((d) => {
        return (
          <div key={d.value}>
            <input
              className={styles.check}
              type='checkbox'
              name={d.value}
              value={d.value}
              checked={this.props.filter.range[d.value]}
              onChange={(event) => this.props.update(this.props.name, d.value, event.target.checked)}
            />
            <label htmlFor={d.value}>{d.value} ({d.count})</label>
          </div>
        );
      })
    ) : '';

    return (
      <div>
        <label>{this.props.name}</label>
        {buttons}
        {boxes}
      </div>
    );
  }
};
