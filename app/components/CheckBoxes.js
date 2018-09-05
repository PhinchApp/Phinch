import React, { Component } from 'react';

import styles from './CheckBoxes.css';
import gstyle from './general.css';

export default class CheckBoxes extends Component {
  render() {
    const buttons = this.props.filter.expanded ? (
      <div>
        <div
          className={styles.toggle}
          onClick={() => this.props.setAll(this.props.name, true)}
        >
          all
        </div>
        <div
          className={styles.toggle}
          onClick={() => this.props.setAll(this.props.name, false)}
        >
          none
        </div>
      </div>
    ) : '';
    const boxes = this.props.filter.expanded ? (
      this.props.data.values.map((d) => {
        return (
          <div key={d.value} className={styles.row}>
            <label className={gstyle.checkbox}>
              <input
                type='checkbox'
                name={d.value}
                value={d.value}
                checked={this.props.filter.range[d.value]}
                onChange={(event) => this.props.update(this.props.name, d.value, event.target.checked)}
              />
              <span className={gstyle.checkmark}></span>
            </label>
            <label style={{marginLeft: '4px'}} htmlFor={d.value}>{d.value} ({d.count})</label>
          </div>
        );
      })
    ) : '';
    return (
      <div className={styles.group}>
        <label className={styles.name}>{this.props.name}</label>
        {buttons}
        {boxes}
      </div>
    );
  }
};
